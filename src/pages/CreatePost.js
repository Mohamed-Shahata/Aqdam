import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Textarea,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormErrorMessage,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';
import { useColorModeValue } from '@chakra-ui/react';
import Cookies from "js-cookie"
import axios from 'axios';


const CreatePost = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams(); // For edit mode (e.g., /edit-post/:id)
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    resources: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = Cookies.get("token");
  // Fetch post data for edit mode
  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setIsLoading(true);
        try {
          const response = await api.get(`/posts/${id}`);
          setFormData({
            title: response.data.title || '',
            content: response.data.content || '',
            resources: response.data.resources || '',
          });
        } catch (error) {
          console.error('Fetch Post Error:', error);
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to fetch post.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/create-post'); // Redirect to create mode if post not found
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, toast, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        ...(formData.resources && { resources: formData.resources }),
      };

      if (id) {
        // Update post
        await axios.patch(`https://aqdambackend-production-0985.up.railway.app/api/posts/${id}`, payload, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast({
          title: 'Success',
          description: 'Post updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create post
        await api.post('/posts', payload);
        toast({
          title: 'Success',
          description: 'Post created successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      navigate('/home'); // Redirect to Home after success
    } catch (error) {
      console.error('Submit Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save post.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    try {
      await axios.delete(`https://aqdambackend-production-0985.up.railway.app/api/posts/${id}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast({
        title: 'Success',
        description: 'Post deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/home');
    } catch (error) {
      console.error('Delete Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete post.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // Open/close delete modal
  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <Heading size="lg">Please log in to create a post.</Heading>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack>
          <Spinner size="xl" />
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">{id ? 'Edit Educational Post' : 'Create Educational Post'}</Heading>
        <Box
          p={6}
          borderWidth={1}
          borderRadius="md"
          boxShadow="sm"
          bg={bg}
          borderColor={borderColor}
        >
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {/* Title */}
              <FormControl isInvalid={!!errors.title} isRequired>
                <FormLabel>Title</FormLabel>
                <Textarea
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter the title of the post"
                  rows={2}
                />
                <FormErrorMessage>{errors.title}</FormErrorMessage>
              </FormControl>

              {/* Content */}
              <FormControl isInvalid={!!errors.content} isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Enter the main content"
                  rows={8}
                />
                <FormErrorMessage>{errors.content}</FormErrorMessage>
              </FormControl>

              {/* Resources */}
              <FormControl>
                <FormLabel>Resources (Optional)</FormLabel>
                <Textarea
                  name="resources"
                  value={formData.resources}
                  onChange={handleChange}
                  placeholder="Enter resources or links (optional)"
                  rows={4}
                />
              </FormControl>

              {/* Buttons */}
              <Flex justify="space-between" width="full">
                <Button
                  type="submit"
                  colorScheme="teal"
                  isLoading={isSubmitting}
                  loadingText={id ? 'Updating...' : 'Creating...'}
                >
                  {id ? 'Update Post' : 'Create Post'}
                </Button>
                {id && (
                  <Button colorScheme="red" variant="outline" onClick={openDeleteModal}>
                    Delete Post
                  </Button>
                )}
              </Flex>
            </VStack>
          </form>
        </Box>
      </VStack>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to delete this post?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default CreatePost;