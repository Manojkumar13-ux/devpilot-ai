import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import bcrypt from 'bcryptjs';
import { logger } from '../lib/logger.js';

const DEFAULT_SETTINGS = {
  general: { displayName: '', timezone: 'UTC', language: 'en' },
  appearance: { theme: 'dark', primaryColor: '#6c63ff', fontSize: 14, compactMode: false },
  editor: { theme: 'vs-dark', fontFamily: "'JetBrains Mono', monospace", tabSize: 2, autoSave: true, lineNumbers: true, minimap: true },
  notifications: { emailNotifications: true, submissionResults: true, aiReviewReady: true, weeklyReport: false },
};

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    let profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: req.userId, settings: DEFAULT_SETTINGS },
      });
    }

    const settings = (profile.settings as Record<string, unknown>) ?? {};
    res.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (error) {
    logger.error({ err: error }, 'Get settings error');
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });
    const current = (existing?.settings as Record<string, unknown>) ?? {};

    const merged = { ...DEFAULT_SETTINGS, ...current, ...req.body };

    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, settings: merged },
      update: { settings: merged },
    });

    res.json(profile.settings);
  } catch (error) {
    logger.error({ err: error }, 'Update settings error');
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' }); return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' }); return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: 'Current password is incorrect' }); return; }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Change password error');
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { password } = req.body;
    if (!password) { res.status(400).json({ error: 'Password is required to delete account' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(400).json({ error: 'Password is incorrect' }); return; }

    await prisma.user.delete({ where: { id: req.userId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Delete account error');
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
