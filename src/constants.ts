export const ERROR_MESSAGES = {
  EMAIL_FAILED: 'Failed to send welcome email.',
  RABBITMQ_FAILED: 'Failed to publish user creation event.',
  USER_FAILED: 'Failed to create user.',
  USER_NOT_FOUND: 'User not found',
  AVATAR_ERROR: 'Unexpected error while fetching avatar',
  AVATAR_FAILED: 'Failed to fetch avatar image',
  AVATAR_NOT_FOUND: 'Avatar image not found',
  AVATAR_NOT_DELETED: 'Failed to delete avatar',
  USER_FETCH_FAILED: (userId: string) =>
    `Failed to fetch user with ID ${userId}`,
  USER_NOT_FOUND_WITH_ID: (userId: string) =>
    `User with ID ${userId} not found.`,
};
export const SUCCESS_MESSAGES = {
  DELETED_SUCCESSFUL: 'Avatar deleted successful!',
};

export const URLs = {
  USER_URL: (userId: string) => `https://reqres.in/api/users/${userId}`,
  AVATAR_URL: (userId: string) =>
    `https://reqres.in/img/faces/${userId}-image.jpg`,
};

export const RABBITMQ = {
  PRODUCER_PATTERN: 'rabbit-mq-producer',
};
