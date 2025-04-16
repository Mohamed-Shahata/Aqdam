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
import { Link as RouterLink } from 'react-router-dom';
import { HamburgerIcon } from '@chakra-ui/icons';
import React, { useContext, useEffect, useState } from 'react';
import api from '../api';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';
import { format } from 'date-fns';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const jobsResponse = await api.get('/jobs');
        setJobs(jobsResponse.data);
      } catch (error) {
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
    fetchJobs();
  }, [toast]);

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

  return (
    <Container maxW="container.md" py={8}>
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
              {/* Menu for actions */}
              {user && (
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
                      <MenuItem>Add to Favorites</MenuItem>
                    )}
                  </MenuList>
                </Menu>
              )}

              {/* User Info */}
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


              {/* Job Details */}
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

              {/* Apply Button */}
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

      {/* Delete Confirmation Modal */}
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