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
import Cookies from 'js-cookie';

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

  const token = Cookies.get('token');

  // Fetch post data for edit mode
  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        if (!token) {
          toast({
            title: 'خطأ',
            description: 'التوكن غير موجود. من فضلك سجلي دخول.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/login');
          return;
        }

        setIsLoading(true);
        try {
          const response = await api.get(`/posts/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFormData({
            title: response.data.title || '',
            content: response.data.content || '',
            resources: response.data.resources || '',
          });
        } catch (error) {
          console.error('Fetch Post Error:', error);
          toast({
            title: 'خطأ',
            description: error.response?.data?.message || 'فشل جلب البوست.',
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
  }, [id, toast, navigate, token]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'العنوان مطلوب';
    if (!formData.content.trim()) newErrors.content = 'المحتوى مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: 'خطأ',
        description: 'من فضلك املئي كل الحقول المطلوبة.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!token) {
      toast({
        title: 'خطأ',
        description: 'التوكن غير موجود. من فضلك سجلي دخول.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
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
        await api.patch(`/posts/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({
          title: 'نجاح',
          description: 'تم تعديل البوست بنجاح.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Create post
        await api.post('/posts', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({
          title: 'نجاح',
          description: 'تم إنشاء البوست بنجاح.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      setTimeout(() => navigate('/home'), 1000); // Delay navigation to show toast
    } catch (error) {
      console.error('Submit Error:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'فشل حفظ البوست.',
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
    if (!token) {
      toast({
        title: 'خطأ',
        description: 'التوكن غير موجود. من فضلك سجلي دخول.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    try {
      await api.delete(`/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: 'نجاح',
        description: 'تم حذف البوست بنجاح.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setTimeout(() => navigate('/home'), 1000); // Delay navigation to show toast
    } catch (error) {
      console.error('Delete Error:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'فشل حذف البوست.',
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
        <Heading size="lg">من فضلك سجلي دخول لإنشاء بوست.</Heading>
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
        <Heading size="lg">{id ? 'تعديل بوست تعليمي' : 'إنشاء بوست تعليمي'}</Heading>
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
                <FormLabel>العنوان</FormLabel>
                <Textarea
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="أدخلي عنوان البوست"
                  rows={2}
                />
                <FormErrorMessage>{errors.title}</FormErrorMessage>
              </FormControl>

              {/* Content */}
              <FormControl isInvalid={!!errors.content} isRequired>
                <FormLabel>المحتوى</FormLabel>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="أدخلي المحتوى الرئيسي"
                  rows={8}
                />
                <FormErrorMessage>{errors.content}</FormErrorMessage>
              </FormControl>

              {/* Resources */}
              <FormControl>
                <FormLabel>الموارد (اختياري)</FormLabel>
                <Textarea
                  name="resources"
                  value={formData.resources}
                  onChange={handleChange}
                  placeholder="أدخلي الموارد أو الروابط (اختياري)"
                  rows={4}
                />
              </FormControl>

              {/* Buttons */}
              <Flex justify="space-between" width="full">
                <Button
                  type="submit"
                  colorScheme="teal"
                  isLoading={isSubmitting}
                  loadingText={id ? 'جاري التعديل...' : 'جاري الإنشاء...'}
                >
                  {id ? 'تعديل البوست' : 'إنشاء البوست'}
                </Button>
                {id && (
                  <Button colorScheme="red" variant="outline" onClick={openDeleteModal}>
                    حذف البوست
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
          <ModalHeader>تأكيد الحذف</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>هل أنتِ متأكدة من حذف هذا البوست؟</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              إلغاء
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              تأكيد
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default CreatePost;