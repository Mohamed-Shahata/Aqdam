import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  UnorderedList,
  ListItem,
  Link,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { HamburgerIcon } from '@chakra-ui/icons';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchJobAndFavorites = async () => {
      setIsLoading(true);
      try {
        // Fetch job details
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data);

        // Check if user is available
        if (user && user.id) {
          setIsUserLoading(false);
          try {
            const favoritesResponse = await api.post('/jobs/favorites/me');
            // Handle different response formats
            let favoritesData = [];
            if (Array.isArray(favoritesResponse.data)) {
              favoritesData = favoritesResponse.data
                .map((fav) => {
                  const jobId = fav.jobId !== undefined ? fav.jobId : fav.id; // Handle jobId or id
                  return jobId !== undefined && !isNaN(Number(jobId)) ? Number(jobId) : null;
                })
                .filter((id) => id !== null);
            } else if (favoritesResponse.data.favorites && Array.isArray(favoritesResponse.data.favorites)) {
              favoritesData = favoritesResponse.data.favorites
                .map((fav) => {
                  const jobId = fav.jobId !== undefined ? fav.jobId : fav.id;
                  return jobId !== undefined && !isNaN(Number(jobId)) ? Number(jobId) : null;
                })
                .filter((id) => id !== null);
            }
            setFavorites(favoritesData);
          } catch (favError) {
            console.error('Favorites Error:', favError);
            toast({
              title: 'Error',
              description: 'Failed to fetch favorites.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            setFavorites([]);
          }
        } else {
          setIsUserLoading(true);
        }
      } catch (error) {
        console.error('Job Fetch Error:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch job details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobAndFavorites();
  }, [id, toast, user]);

  // Helper function to convert string to list items
  const stringToList = (str) => {
    if (!str) return [];
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
  };

  const handleFavorite = async (jobId) => {
    if (!user || !user.id) {
      toast({
        title: 'Error',
        description: 'Please log in to manage favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      if (favorites.includes(Number(jobId))) {
        await api.delete(`/jobs/favorites/${jobId}`);
        setFavorites(favorites.filter((id) => id !== Number(jobId)));
        toast({
          title: 'Success',
          description: 'Removed from favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await api.post('/jobs/favorites', { jobId });
        setFavorites([...favorites, Number(jobId)]);
        toast({
          title: 'Success',
          description: 'Added to favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Favorite Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to manage favorite.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      setJob(null);
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

  if (!job) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Job not found.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Box
        p={5}
        borderWidth={1}
        borderRadius="md"
        boxShadow="sm"
        bg={bg}
        borderColor={borderColor}
        position="relative"
      >
        {/* Menu and Favorite Icon */}
        {isUserLoading ? (
          <Spinner size="sm" position="absolute" top={4} right={4} />
        ) : user && user.id ? (
          <>
            {/* Favorite Icon */}
            <Tooltip
              label={favorites.includes(Number(job.id)) ? 'Remove from favorites' : 'Add to favorites'}
              hasArrow
            >
              <IconButton
                icon={favorites.includes(Number(job.id)) ? <FaHeart /> : <FaRegHeart />}
                color={favorites.includes(Number(job.id)) ? 'teal.500' : 'gray.500'}
                variant="ghost"
                size="sm"
                position="absolute"
                top={4}
                right={user && job.user && Number(job.user.id) === Number(user.id) ? 12 : 4}
                aria-label={favorites.includes(Number(job.id)) ? 'Remove from favorites' : 'Add to favorites'}
                _hover={{ color: 'teal.600' }}
                onClick={() => handleFavorite(job.id)}
              />
            </Tooltip>
            {/* Menu for Edit/Delete (only for job owner) */}
            {job.user && Number(job.user.id) === Number(user.id) && (
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
                  <MenuItem as={RouterLink} to={`/edit-job/${job.id}`}>
                    Edit
                  </MenuItem>
                  <MenuItem onClick={() => openDeleteModal(job.id)}>
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </>
        ) : null}

        {/* User Info with Date */}
        <Flex align="center" mb={4}>
          <Avatar size="md" src={job.user?.profileImage} mr={3} />
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

        {/* Job Details */}
        <Heading size="lg" mb={4}>
          {job.title}
        </Heading>

        {job.short_intro && (
          <Text color={textColor} mb={4}>
            {job.short_intro}
          </Text>
        )}

        <Text fontWeight="semibold" mb={2}>
          Responsibilities:
        </Text>
        <UnorderedList mb={4} color={textColor}>
          {stringToList(job.responsibilities).map((item, index) => (
            <ListItem key={index}>{item}</ListItem>
          ))}
        </UnorderedList>

        <Text fontWeight="semibold" mb={2}>
          Requirements:
        </Text>
        <UnorderedList mb={4} color={textColor}>
          {stringToList(job.requirements).map((item, index) => (
            <ListItem key={index}>{item}</ListItem>
          ))}
        </UnorderedList>

        {job.extra_info && (
          <>
            <Text fontWeight="semibold" mb={2}>
              Extra Info:
            </Text>
            <Text color={textColor} mb={4}>
              {job.extra_info}
            </Text>
          </>
        )}

        {/* Apply Button */}
        {job.email_applay && (
          <Flex justifyContent="center">
            <Button
              as="a"
              href={`mailto:${job.email_applay}?subject=Job Application - ${encodeURIComponent(job.title)}`}
              colorScheme="teal"
              size="lg"
              height={{ base: '40px', md: '40px' }}
              width={{ base: 'full', md: '80%' }}
              borderRadius="md"
              mb={4}
            >
              Apply via Email
            </Button>
          </Flex>
        )}

        <Text fontSize="sm" color="gray.500">
          Posted on: {new Date(job.createdAt).toLocaleDateString()}
        </Text>
      </Box>

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

export default JobDetails;