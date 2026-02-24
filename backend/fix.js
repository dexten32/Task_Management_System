const fs = require('fs');
const lines = fs.readFileSync('src/controllers/taskController.ts', 'utf8').split('\n');
const goodLines = lines.slice(0, 574);
const newFunc = `export const updateTaskAssignees = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { assignees } = req.body;
  if (!Array.isArray(assignees)) return res.status(400).json({ error: 'assignees must be an array of IDs' });

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const reqUser = req.user as any;
    if (!reqUser || (reqUser.role !== 'MANAGER' && reqUser.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (reqUser.role === 'MANAGER') {
      const usersToAssign = await prisma.user.findMany({ where: { id: { in: assignees } } });
      const invalidUsers = usersToAssign.filter((u: any) => u.departmentId !== reqUser.departmentId);
      if (invalidUsers.length > 0) {
        return res.status(403).json({ message: 'Managers can only assign users in their department.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { assignees: { set: assignees.map((id: string) => ({ id })) } },
      include: {
        assignees: { select: { id: true, name: true, department: { select: { name: true, id: true } } } },
        priority: { select: { code: true, name: true, color: true } },
        assignedBy: { select: { name: true, id: true } }
      }
    });

    return res.status(200).json({ message: 'Assignees updated', task: updatedTask });
  } catch (error) {
    console.error('Failed to update task assignees:', error);
    return res.status(500).json({ error: 'Failed to update task assignees' });
  }
};
`;

fs.writeFileSync('src/controllers/taskController.ts', goodLines.join('\n') + '\n' + newFunc);
