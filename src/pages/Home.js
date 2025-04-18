import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  IconButton,
  Link,
  Button,
  UnorderedList,
  ListItem,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { HamburgerIcon, BellIcon } from '@chakra-ui/icons';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import React, { useContext, useEffect, useState, useRef } from 'react';
import api from '../api';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import io from 'socket.io-client';

// Initialize Socket.IO
const socket = io('http://localhost:3000', { withCredentials: true });

const Home = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]); // Ensure initial state is an array
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  // Bell color based on unread notifications
  const bellColor = useColorModeValue(
    notifications.filter(n => !n.isRead).length > 0 ? 'yellow.500' : 'gray.500',
    notifications.filter(n => !n.isRead).length > 0 ? 'yellow.300' : 'gray.300'
  );

  // Audio for notification sound
  const notificationSound = useRef(null);

  useEffect(() => {
    // Initialize audio
    notificationSound.current = new Audio('/sounds/n.mp3');
    notificationSound.current.volume = 0.5; // Adjust volume (0.0 to 1.0)

    const fetchJobsAndFavorites = async () => {
      setIsLoading(true);
      try {
        const jobsResponse = await api.get('/jobs/following');
        setJobs(jobsResponse.data);

        if (user) {
          const favoritesResponse = await api.post('/jobs/favorites/me');
          setFavorites(favoritesResponse.data.map(fav => fav.id));

          const notificationsResponse = await api.get('/notifications');
          const fetchedNotifications = Array.isArray(notificationsResponse.data)
            ? notificationsResponse.data
            : [];
          setNotifications(fetchedNotifications);
        }
      } catch (error) {
        console.error('Fetch Error:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchJobsAndFavorites();
      socket.emit('join', user.id);
      socket.on('notification', (notification) => {
        if (notification && typeof notification === 'object' && notification.message && notification.jobId) {
          setNotifications((prev) => {
            const validPrev = Array.isArray(prev) ? prev : [];
            const updatedNotifications = [notification, ...validPrev];
            // Play notification sound
            notificationSound.current.play().catch((err) => {
              console.warn('Failed to play notification sound:', err);
            });
            return updatedNotifications;
          });
          toast({
            title: 'New Notification',
            description: notification.message,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        } else {
          console.warn('Invalid notification received:', notification);
        }
      });
    }

    return () => {
      socket.off('notification');
    };
  }, [toast, user]);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId, jobId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark notification as read.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Helper function to convert string to list items
  const stringToList = (str) => {
    if (!str) return [];
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter((job) => job.id !== jobId));
      toast({
        title: 'Success',
        description: 'Job deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete job.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFavorite = async (jobId) => {
    try {
      if (favorites.includes(jobId)) {
        await api.delete(`/jobs/favorites/${jobId}`);
        setFavorites(favorites.filter(id => id !== jobId));
        toast({
          title: 'Success',
          description: 'Removed from favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await api.post('/jobs/favorites', { jobId });
        setFavorites([...favorites, jobId]);
        toast({
          title: 'Success',
          description: 'Added to favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openDeleteModal = (jobId) => {
    setJobIdToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setJobIdToDelete(null);
  };

  const confirmDeleteJob = async () => {
    if (jobIdToDelete) {
      await handleDeleteJob(jobIdToDelete);
    }
    closeDeleteModal();
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

  // Ensure notifications is an array before filtering
  const validNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <Container maxW="container.md" py={8}>
      <Flex justify="space-between" mb={6}>
        {user && (
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<BellIcon boxSize={8} />}
              variant="ghost"
              size="xl" // Larger bell
              aria-label="Notifications"
              position="relative"
              color={bellColor}
            >
              {validNotifications.filter(n => !n.isRead).length > 0 && (
                <Box
                  position="absolute"
                  top={0}
                  right={0}
                  bg="yellow.500"
                  color="white"
                  borderRadius="full"
                  w={5}
                  h={5}
                  fontSize="sm"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {validNotifications.filter(n => !n.isRead).length}
                </Box>
              )}
            </MenuButton>
            <MenuList maxH="300px" overflowY="auto">
              {validNotifications.length === 0 ? (
                <MenuItem>No notifications yet.</MenuItem>
              ) : (
                validNotifications.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id, notification.jobId)}
                    bg={notification.isRead ? 'transparent' : 'yellow.50'}
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontWeight={notification.isRead ? 'normal' : 'bold'}>
                        {notification.message}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {dayjs(notification.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </VStack>
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>
        )}
      </Flex>
      {jobs.length === 0 ? (
        <Text>No jobs available yet.</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {jobs.map((job) => (
            <Box
              key={job.id}
              p={8}
              minHeight="240px"
              borderWidth={1}
              borderRadius="md"
              boxShadow="sm"
              bg={bg}
              borderColor={borderColor}
              position="relative"
            >
              {user && (
                <>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<HamburgerIcon />}
                      variant="ghost"
                      size="sm"
                      position="absolute"
                      top={4}
                      right={4}
                      aria-label="Job options"
                    />
                    <MenuList>
                      {Number(job.user?.id) === Number(user.id) ? (
                        <>
                          <MenuItem as={RouterLink} to={`/jobs/edit/${job.id}`}>
                            Edit
                          </MenuItem>
                          <MenuItem onClick={() => openDeleteModal(job.id)}>
                            Delete
                          </MenuItem>
                        </>
                      ) : (
                        <MenuItem onClick={() => handleFavorite(job.id)}>
                          {favorites.includes(job.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                        </MenuItem>
                      )}
                    </MenuList>
                  </Menu>
                  <IconButton
                    icon={favorites.includes(job.id) ? <FaHeart /> : <FaRegHeart />}
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    top={4}
                    right={12}
                    aria-label={favorites.includes(job.id) ? 'Remove from favorites' : 'Add to favorites'}
                    color={favorites.includes(job.id) ? 'teal.500' : 'gray.500'}
                    _hover={{ color: 'teal.600' }}
                    onClick={() => handleFavorite(job.id)}
                  />
                </>
              )}
              <Flex align="center" mb={6}>
                <Avatar
                  size="md"
                  src={job.user?.profileImage}
                  mr={3}
                />
                <Box>
                  <Link
                    as={RouterLink}
                    to={`/profile/${job.user?.id}`}
                    fontWeight="bold"
                    color="teal.500"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {job.user?.firstName} {job.user?.lastName}
                  </Link>
                  <Text fontSize="sm" color="gray.500">
                    {format(new Date(job.createdAt), 'hh:mm a')} - {dayjs(job.createdAt).format('YYYY-MM-DD')}
                  </Text>
                </Box>
              </Flex>
              <Heading
                size="md"
                mb={4}
                as={RouterLink}
                to={`/jobs/${job.id}`}
                color="teal.500"
                _hover={{ textDecoration: 'underline' }}
              >
                {job.title}
              </Heading>
              {job.short_intro && (
                <Text color={textColor} mb={4}>
                  {truncateText(job.short_intro, 100)}
                </Text>
              )}
              {job.responsibilities && (
                <>
                  <Text fontWeight="semibold" mb={2}>
                    Responsibilities:
                  </Text>
                  <UnorderedList mb={4} color={textColor}>
                    {stringToList(job.responsibilities)
                      .slice(0, 2)
                      .map((item, index) => (
                        <ListItem key={index}>{item}</ListItem>
                      ))}
                    {stringToList(job.responsibilities).length > 2 && (
                      <Text as="span" color={textColor} fontSize="sm">
                        ...
                      </Text>
                    )}
                  </UnorderedList>
                </>
              )}
              {job.email_applay && (
                <Button
                  as="a"
                  href={`mailto:${job.email_applay}?subject=Job Application - ${encodeURIComponent(job.title)}`}
                  colorScheme="teal"
                  size="lg"
                  width={{ base: 'full', md: 'auto' }}
                  height={{ base: '40px', md: '40px' }}
                  borderRadius="md"
                  mt={2}
                  mb={4}
                >
                  Apply via Email
                </Button>
              )}
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this job?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDeleteJob}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Home;