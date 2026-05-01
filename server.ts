import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import cron from "node-cron";

dotenv.config();

const app = express();
const PORT = 3000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Middlewares ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access token missing" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// --- Validation Schemas ---
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["To Do", "In Progress", "Done"]).optional(),
  dueDate: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional().nullable(),
});

// --- API Routes ---

// Auth
app.post("/api/auth/signup", async (req: any, res: any) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email }});
    if (existing) return res.status(400).json({ error: "Email already taken" });

    // Ensure the first user is an Admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "Admin" : "Member";

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword, role }
    });

    const token = jwt.sign({ userId: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as z.ZodError).issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req: any, res: any) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email }});
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Users
app.get("/api/users", authenticateToken, async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/users/:id/role", authenticateToken, requireRole(["Admin"]), async (req: any, res: any) => {
  try {
    const { role } = req.body;
    if (!["Admin", "Manager", "Member"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/users/me", authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Projects
app.get("/api/projects", authenticateToken, async (req: any, res: any) => {
  try {
    let projects;
    if (req.user.role === "Admin") {
      projects = await prisma.project.findMany({ include: { members: { include: { user: { select: { name: true } } } } }});
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user.userId } }
        },
        include: { members: { include: { user: { select: { name: true } } } } }
      });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/projects", authenticateToken, async (req: any, res: any) => {
  try {
    const data = projectSchema.parse(req.body);
    
    const membersToCreate = [
      { userId: req.user.userId }
    ];
    
    if (data.memberIds && Array.isArray(data.memberIds)) {
      data.memberIds.forEach((id: string) => {
        if (id !== req.user.userId) {
          membersToCreate.push({ userId: id });
        }
      });
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : null,
        members: {
          create: membersToCreate
        }
      }
    });
    
    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as z.ZodError).issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/projects/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: { select: { id: true, title: true, status: true, priority: true } }
      }
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Ensure user has access if Member
    if (req.user.role === "Member") {
      const isMember = project.members.some((m: any) => m.userId === req.user.userId);
      if (!isMember) return res.status(403).json({ error: "Access denied" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add member to project
app.post("/api/projects/:id/members", authenticateToken, requireRole(["Admin", "Manager"]), async (req: any, res: any) => {
  try {
    const { userId } = req.body;
    const member = await prisma.projectMember.create({
      data: { projectId: req.params.id, userId }
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: "Error adding member" });
  }
});

app.delete("/api/projects/:id/members/:userId", authenticateToken, requireRole(["Admin", "Manager"]), async (req: any, res: any) => {
  try {
    const { id, userId } = req.params;
    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: id, userId }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error removing member" });
  }
});

// Tasks
app.get("/api/tasks", authenticateToken, async (req: any, res: any) => {
  try {
    const { projectId, status, priority, assigneeId } = req.query;
    let whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assigneeId) {
      if (assigneeId === 'unassigned') {
        whereClause.assigneeId = null;
      } else {
        whereClause.assigneeId = assigneeId;
      }
    }
    
    if (req.user.role === "Member") {
      // Members only see tasks in their projects, or tasks assigned to them
      // Let's just limit to tasks assigned to them, or projects they are in
      whereClause.project = {
        members: { some: { userId: req.user.userId } }
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true } },
        assignee: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/tasks", authenticateToken, requireRole(["Admin", "Manager"]), async (req: any, res: any) => {
  try {
    const data = taskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        assigneeId: data.assigneeId
      }
    });
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as z.ZodError).issues });
    res.status(500).json({ error: String(error) });
  }
});

app.get("/api/tasks/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true, description: true } },
        assignee: { select: { id: true, name: true, email: true } },
        attachments: true
      }
    });
    
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (req.user.role === "Member") {
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId: req.user.userId }
      });
      if (!isMember) return res.status(403).json({ error: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/tasks/:id/attachments", authenticateToken, async (req: any, res: any) => {
  try {
    const { filename, url } = req.body;
    const attachment = await prisma.taskAttachment.create({
      data: {
        filename,
        url,
        taskId: req.params.id
      }
    });
    res.json(attachment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create attachment" });
  }
});

app.delete("/api/tasks/:taskId/attachments/:id", authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.taskAttachment.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});

app.patch("/api/tasks/:id", authenticateToken, async (req: any, res: any) => {
  try {
    // Member can only update status. Admin/Manager can update anything.
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    let updateData = req.body;
    if (req.user.role === "Member") {
      // Check if user is assigned to this task
      if (task.assigneeId !== req.user.userId) {
        return res.status(403).json({ error: "Can only update assigned tasks" });
      }
      // Members can only update status
      updateData = { status: req.body.status };
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/tasks/:id", authenticateToken, requireRole(["Admin", "Manager"]), async (req: any, res: any) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Dashboard stats
app.get("/api/dashboard", authenticateToken, async (req: any, res: any) => {
  try {
    let whereClause: any = {};
    if (req.user.role === "Member") {
      whereClause.assigneeId = req.user.userId;
    }

    const tasks = await prisma.task.findMany({ where: whereClause });
    const total = tasks.length;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let overdue = 0;
    const now = new Date();

    for (const t of tasks) {
      if (t.status === "Done") completed++;
      else if (t.status === "In Progress") inProgress++;
      else pending++;

      if (t.dueDate && t.status !== "Done" && new Date(t.dueDate) < now) {
        overdue++;
      }
    }

    res.json({ total, completed, inProgress, pending, overdue });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Notifications
app.get("/api/notifications", authenticateToken, async (req: any, res: any) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
      include: { task: { select: { title: true, projectId: true } } }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/notifications/read-all", authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res: any) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user settings
app.patch("/api/users/settings", authenticateToken, async (req: any, res: any) => {
  try {
    const { notifyApproaching, notifyOverdue } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { 
        notifyApproaching: notifyApproaching !== undefined ? notifyApproaching : undefined,
        notifyOverdue: notifyOverdue !== undefined ? notifyOverdue : undefined
      }
    });
    res.json({ notifyApproaching: user.notifyApproaching, notifyOverdue: user.notifyOverdue });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/settings", authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { notifyApproaching: true, notifyOverdue: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// CRON JOB
cron.schedule('*/10 * * * *', async () => {
  console.log("Running task due date checker...");
  try {
    const users = await prisma.user.findMany();
    const now = new Date();
    const approachingThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    for (const user of users) {
      if (!user.notifyApproaching && !user.notifyOverdue) continue;

      const tasks = await prisma.task.findMany({
        where: { assigneeId: user.id, status: { not: "Done" }, dueDate: { not: null } }
      });

      for (const task of tasks) {
        if (!task.dueDate) continue;

        if (task.dueDate < now && user.notifyOverdue) {
          const recentOverdue = await prisma.notification.findFirst({
            where: { userId: user.id, taskId: task.id, type: 'OVERDUE', createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
          });
          
          if (!recentOverdue) {
            await prisma.notification.create({
              data: { userId: user.id, taskId: task.id, type: 'OVERDUE', message: `Task "${task.title}" is overdue!` }
            });
          }
        } else if (task.dueDate <= approachingThreshold && task.dueDate > now && user.notifyApproaching) {
          const recentApproaching = await prisma.notification.findFirst({
            where: { userId: user.id, taskId: task.id, type: 'APPROACHING' }
          });

          if (!recentApproaching) {
             await prisma.notification.create({
              data: { userId: user.id, taskId: task.id, type: 'APPROACHING', message: `Task "${task.title}" is due soon!` }
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Cron Error", e);
  }
});

// --- Vite Middleware or Static ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // production mode
    const distPath = path.join(process.cwd(), 'dist');
    // Using express setup pattern standard, where *all catches all
    // Since TS compiler checks Express version here, Express 4.x get('*')
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
