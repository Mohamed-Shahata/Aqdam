import { Avatar, Box, Button, Container, Flex, FormControl, FormLabel, Heading, HStack, IconButton, Input, useColorModeValue, useToast, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';
import { FaCamera, FaFileUpload } from 'react-icons/fa';
import { DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Cookies from "js-cookie"

function EditProfile() {
  const { user, updateUser } = useContext(AuthContext);

  const [newData, setNewData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    age: ''
  });

  const [newAvatar, setNewAvatar] = useState(user.profileImage);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (user) {
      setNewData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        age: user.age || ''
      });
      setNewAvatar(user.profileImage || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Please upload a JPEG or PNG image.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      if (file.size > maxSize) {
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }
      setNewAvatar(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!newAvatar || !(newAvatar instanceof File)) {
      toast({
        title: 'Error',
        description: 'Please select an image to upload.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('user-image', newAvatar);

      const token = Cookies.get("token");
      const response = await axios.post("https://aqdambackend-production-0985.up.railway.app/api/users/images/upload-image", formData, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const newImageUrl = response.data.imageUrl;
      if (!newImageUrl) {
        throw new Error('Image URL not returned from server');
      }

      setNewAvatar(newImageUrl);
      updateUser({ ...user, profileImage: newImageUrl });
      toast({
        title: 'Success',
        description: 'Profile image updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to upload image. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      const token = Cookies.get("token");
      await axios.delete("https://aqdambackend-production-0985.up.railway.app/api/users/images/delete-image", {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      updateUser({ ...user, profileImage: '' });
      setNewAvatar(null);
      toast({
        title: 'Success',
        description: 'Profile image deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to delete image.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const updateData = {};
      if (newData.firstName !== user.firstName)
        updateData.firstName = newData.firstName;
      if (newData.lastName !== user.lastName)
        updateData.lastName = newData.lastName;
      if (newData.bio !== user.bio) updateData.bio = newData.bio;
      if (newData.age !== user.age) updateData.age = Number(newData.age);

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No changes',
          description: 'No profile changes to save.',
          status: 'info',
          duration: 5000,
          isClosable: true
        });
        navigate('/profile');
        return;
      }

      await api.patch('/users', updateData);
      updateUser(updateData);
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      navigate('/profile');
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to update profile.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={8}>Edit Profile</Heading>

      {/* Profile Picture Section */}
      <VStack spacing={4} align="center" mb={10}>
        <Box position="relative">
          <Avatar
            size="2xl"
            src={
              newAvatar instanceof File
                ? URL.createObjectURL(newAvatar)
                : newAvatar || user?.profileImage
            }
            borderWidth={2}
            borderColor={useColorModeValue('gray.200', 'gray.600')}
          />
          <Input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
            display="none"
            id="avatar-upload"
            isDisabled={isUploading || isDeletingAvatar}
          />
          <IconButton
            as="label"
            htmlFor="avatar-upload"
            icon={<FaCamera />}
            aria-label="Change profile picture"
            size="sm"
            colorScheme="teal"
            borderRadius="full"
            position="absolute"
            bottom={0}
            right={0}
            boxShadow="md"
            _hover={{ bg: 'teal.500' }}
            cursor="pointer"
          />
        </Box>
        <Flex justify="center" width="100%">
          <HStack
            spacing={4}
            direction={{ base: 'column', md: 'row' }}
            flexDirection={{ base: 'column', md: 'row' }}
            align="center"
            width={{ base: '100%', md: 'auto' }}
          >
            <Button
              onClick={handleUploadAvatar}
              leftIcon={<FaFileUpload />}
              colorScheme="teal"
              variant="solid"
              size="md"
              isDisabled={isUploading || isDeletingAvatar || !newAvatar}
              isLoading={isUploading}
              loadingText="Uploading"
              bg="teal"
              _hover={{ bg: 'teal.500' }}
              borderRadius="md"
              px={6}
              py={2}
              width={{ base: '100%', md: 'auto' }}
            >
              Upload Picture
            </Button>
            {user?.profileImage && (
              <Button
                leftIcon={<DeleteIcon />}
                colorScheme="red"
                variant="outline"
                size="md"
                onClick={handleDeleteAvatar}
                isDisabled={isUploading || isDeletingAvatar}
                isLoading={isDeletingAvatar}
                loadingText="Deleting"
                borderRadius="md"
                px={6}
                py={2}
                width={{ base: '100%', md: 'auto' }}
              >
                Delete Picture
              </Button>
            )}
          </HStack>
        </Flex>
      </VStack>

      {/* Form Fields */}
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>First Name</FormLabel>
          <Input
            value={newData.firstName}
            onChange={(e) =>
              setNewData({ ...newData, firstName: e.target.value })
            }
            bg={bg}
            borderRadius="md"
            isDisabled={isUpdating}
            _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Last Name</FormLabel>
          <Input
            value={newData.lastName}
            onChange={(e) =>
              setNewData({ ...newData, lastName: e.target.value })
            }
            bg={bg}
            borderRadius="md"
            isDisabled={isUpdating}
            _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Bio</FormLabel>
          <Input
            value={newData.bio}
            onChange={(e) => setNewData({ ...newData, bio: e.target.value })}
            bg={bg}
            borderRadius="md"
            isDisabled={isUpdating}
            _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Age</FormLabel>
          <Input
            type="number"
            value={newData.age}
            onChange={(e) => setNewData({ ...newData, age: e.target.value })}
            bg={bg}
            borderRadius="md"
            isDisabled={isUpdating}
            _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
          />
        </FormControl>
        <Flex justify="space-between" mt={6}>
          <Button
            colorScheme="teal"
            onClick={handleSave}
            isLoading={isUpdating}
            loadingText="Saving"
            bg="teal"
            _hover={{ bg: 'teal.500' }}
            borderRadius="md"
            px={6}
            py={2}
          >
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            isDisabled={isUpdating}
            borderRadius="md"
            px={6}
            py={2}
          >
            Cancel
          </Button>
        </Flex>
      </VStack>
    </Container>
  );
}

export default EditProfile;