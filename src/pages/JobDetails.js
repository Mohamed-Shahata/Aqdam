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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { HamburgerIcon } from '@chakra-ui/icons';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch job details
  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch job details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Fetch user's job favorites
  const { data: favorites = [], isLoading: isFavoritesLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const response = await api.post('/jobs/favorites/me');
      let favoritesData = [];
      if (Array.isArray(response.data)) {
        favoritesData = response.data
          .map((fav) => {
            const jobId = fav.jobId !== undefined ? fav.jobId : fav.id;
            return jobId !== undefined && !isNaN(Number(jobId)) ? Number(jobId) : null;
          })
          .filter((id) => id !== null);
      } else if (response.data.favorites && Array.isArray(response.data.favorites)) {
        favoritesData = response.data.favorites
          .map((fav) => {
            const jobId = fav.jobId !== undefined ? fav.jobId : fav.id;
            return jobId !== undefined && !isNaN(Number(jobId)) ? Number(jobId) : null;
          })
          .filter((id) => id !== null);
      }
      return favoritesData;
    },
    enabled: !!user,
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for handling favorites
  const favoriteMutation = useMutation({
    mutationFn: async (jobId) => {
      if (favorites.includes(Number(jobId))) {
        await api.delete(`/jobs/favorites/${jobId}`);
      } else {
        await api.post('/jobs/favorites', { jobId: Number(jobId) });
      }
    },
    onSuccess: (_, jobId) => {
      queryClient.setQueryData(['favorites', user?.id], (old) =>
        favorites.includes(Number(jobId))
          ? old.filter((id) => id !== Number(jobId))
          : [...old, Number(jobId)]
      );
      toast({
        title: 'Success',
        description: favorites.includes(Number(jobId)) ? 'Removed from favorites.' : 'Added to favorites.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to manage favorite.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for deleting job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId) => {
      await api.delete(`/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']); // Invalidate jobs to refresh related queries
      navigate('/profile'); // Navigate back to profile after deletion
      toast({
        title: 'Success',
        description: 'Job deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete job.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Helper function to convert string to list items
  const stringToList = (str) => {
    if (!str) return [];
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
  };

  const handleFavorite = (jobId) => {
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
    favoriteMutation.mutate(jobId);
  };

  const openDeleteModal = (jobId) => {
    setJobIdToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setJobIdToDelete(null);
  };

  const confirmDeleteJob = () => {
    if (jobIdToDelete) {
      deleteJobMutation.mutate(jobIdToDelete);
    }
    closeDeleteModal();
  };

  if (isJobLoading || isFavoritesLoading) {
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
        {user && user.id ? (
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
                isLoading={favoriteMutation.isLoading && favoriteMutation.variables === job.id}
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