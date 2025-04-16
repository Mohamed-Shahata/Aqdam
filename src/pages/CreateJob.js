import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Flex,
  Text,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const CreateJob = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams(); // For edit mode
  const [formData, setFormData] = useState({
    title: '',
    short_intro: '',
    responsibilities: '',
    requirements: '',
    extra_info: '',
    email_applay: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch job data if in edit mode
  useEffect(() => {
    if (id) {
      const fetchJob = async () => {
        setIsLoading(true);
        try {

          const response = await api.get(`/jobs/${id}`);
          setFormData({
            title: response.data.title || '',
            short_intro: response.data.short_intro || '',
            responsibilities: response.data.responsibilities || '',
            requirements: response.data.requirements || '',
            extra_info: response.data.extra_info || '',
            email_applay: response.data.email_applay || ''
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to fetch job.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/create-job');
        } finally {
          setIsLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, toast, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!formData.title || !formData.responsibilities || !formData.requirements || !formData.email_applay) {
      toast({
        title: 'Error',
        description: 'Title, Responsibilities, Requirements, and Email are required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      if (id) {
        // Update job
        await api.patch(`/jobs/${id}`, formData);
        toast({
          title: 'Job updated',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create job
        await api.post('/jobs', formData);
        toast({
          title: 'Job created',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      navigate('/profile'); // Redirect to profile after success
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save job.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/jobs/${id}`);
      toast({
        title: 'Job deleted',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/profile');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete job.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  if (isLoading && id) {
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
      <Heading mb={6}>{id ? 'Edit Job' : 'Create Job'}</Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter job title"
              borderRadius="md"
              size="lg"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Short Intro (Optional)</FormLabel>
            <Input
              name="short_intro"
              value={formData.short_intro}
              onChange={handleChange}
              placeholder="Brief introduction about the job"
              borderRadius="md"
              size="lg"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Responsibilities</FormLabel>
            <Textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              placeholder="List the job responsibilities"
              borderRadius="md"
              size="lg"
              rows={4}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Requirements</FormLabel>
            <Textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="List the job requirements"
              borderRadius="md"
              size="lg"
              rows={4}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Extra Info (Optional)</FormLabel>
            <Textarea
              name="extra_info"
              value={formData.extra_info}
              onChange={handleChange}
              placeholder="Any additional information"
              borderRadius="md"
              size="lg"
              rows={4}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              name="email_applay"
              value={formData.email_applay}
              onChange={handleChange}
              placeholder="Enter your email"
              borderRadius="md"
              size="lg"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="teal"
            size="lg"
            width="full"
            isLoading={isLoading}
            borderRadius="md"
            mt={4}
          >
            {id ? 'Update Job' : 'Create Job'}
          </Button>

          {id && (
            <Button
              colorScheme="red"
              size="lg"
              width="full"
              variant="outline"
              onClick={onOpen}
              borderRadius="md"
              mt={2}
            >
              Delete Job
            </Button>
          )}
        </VStack>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this job? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default CreateJob;