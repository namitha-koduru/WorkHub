import { Notification } from '../models/Notification.js';
import { emitToUser } from './socket.service.js';

export const createNotification = async ({
  recipient,
  sender = null,
  organizationId,
  workspaceId = null,
  roomId = null,
  type,
  title,
  message,
  link = '',
}) => {
  try {
    // Avoid notifying the actor themselves
    if (sender && String(recipient) === String(sender)) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      organizationId,
      workspaceId,
      roomId,
      type,
      title,
      message,
      link,
    });

    const populatedNotification = await Notification.findById(notification._id).populate(
      'sender',
      'name avatarUrl'
    );

    // Push real-time notification
    emitToUser(recipient, 'notification_received', populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error('[Notification Error] Failed to create notification:', error.message);
  }
};

