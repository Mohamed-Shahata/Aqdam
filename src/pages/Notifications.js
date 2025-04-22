import {
  Box,
  Container,
  VStack,
  Text,
  Spinner,
  Flex,
  useColorModeValue,
  useToast,
  Badge,
  Avatar,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import React, { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!user,
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch notifications.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for marking notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId }) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: (_, { notificationId, jobId, postId }) => {
      queryClient.setQueryData(['notifications', user?.id], (old) =>
        old.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      if (jobId) {
        navigate(`/jobs/${jobId}`);
      } else if (postId) {
        navigate(`/posts/${postId}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark notification as read.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const markNotificationAsRead = (notificationId, jobId, postId) => {
    markAsReadMutation.mutate({ notificationId, jobId, postId });
  };

  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Please log in to view notifications.</Text>
      </Container>
    );
  }

  const validNotifications = notifications;

  return (
    <Container maxW="container.md" py={8}>
      {validNotifications.length === 0 ? (
        <Text>No notifications yet.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {validNotifications.map((notification) => (
            <Box
              key={notification.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              boxShadow="sm"
              bg={notification.isRead ? bg : 'whiteAlpha.100'}
              borderColor={borderColor}
              cursor={notification?.job?.id || notification?.post?.id ? 'pointer' : 'default'}
              onClick={() =>
                (notification?.job?.id || notification?.post?.id) &&
                markNotificationAsRead(notification.id, notification?.job?.id, notification?.post?.id)
              }
            >
              <Flex align="center" justify="start">
                <Avatar
                  size="md"
                  src={notification?.post?.user?.profileImage || notification?.job?.user?.profileImage}
                  mr={4}
                />
                <VStack align="start" spacing={1}>
                  <Flex align="center" gap={2}>
                    {notification?.job?.id && <Badge colorScheme="blue">Job</Badge>}
                    {notification?.post?.id && <Badge colorScheme="green">Post</Badge>}
                    <Text fontWeight={notification.isRead ? 'normal' : 'bold'} color={textColor}>
                      {notification.message}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.500">
                    {dayjs(notification.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
};

export default Notifications;