import { Avatar, Box, Button, Container, Divider, Flex, Heading, IconButton, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useColorModeValue, useDisclosure, useToast, VStack } from '@chakra-ui/react'
import React, { useContext, useState } from 'react'
import PostActions from '../components/PostActions'
import { AuthContext } from '../AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { AddIcon, EditIcon, SettingsIcon } from "@chakra-ui/icons"
import { FaBriefcase } from 'react-icons/fa';

const Profile = () => {

  const { user, logout } = useContext(AuthContext);

  const [posts, setPosts] = useState([
    { id: 1, user: "ahmed", content: "beta post", date: "2025-04-14", likes: 0, hasLiked: false, comments: [] },
  ]);

  const [isDeleteingAccount, setIsDeleteingAccount] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleDeleteAccount = async () => {
    setIsDeleteingAccount(true);
    try {
      await api.delete("/users");
      logout();
      toast({
        title: "Deleted Account successfuly 🎉",
        description: "Deleted Account successfuly successful",
        status: "success",
        duration: 5000,
        isClosable: true
      });
      navigate("/login")
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong"
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsDeleteingAccount(false);
    }
  };

  const handleLike = (postId) => {
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        if (post.hasLiked) {
          return { ...post, likes: post.likes - 1, hasLiked: false }
        } else {
          return { ...post, likes: post.likes + 1, hasLiked: true }
        }
      }
      return post
    }))
  };

  const handleComment = (postId, comment) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
    ))
  }

  return (
    <Container maxW="container.md" py={8}>
      <Flex justify="flex-end" mb={4}>
        <IconButton
          as={RouterLink}
          to="/settings"
          icon={<SettingsIcon boxSize={6} />}
          aria-label='Settings'
          variant="ghost"
        />
      </Flex>
      <Flex direction={{ base: "column", md: "row" }} align={{ base: "center", md: "start" }} mb={6}>
        <Avatar
          size="xl"
          src={user?.profileImage}
          mb={{ base: 4, md: 0 }}
          cursor={user?.profileImage ? 'pointer' : 'default'}
          onClick={user?.profileImage ? onImageOpen : undefined}
        />
        <Box ml={{ base: 0, md: 4 }} textAlign={{ base: "center", md: "left" }}>
          <Text fontSize="2xl" fontWeight="bold">{user.firstName} {user.lastName}</Text>
        </Box>
      </Flex>
      <VStack align="start" spacing={2} mb={6}>
        <Text>{user?.bio || 'No bio avalibale'}</Text>
        <Text>{user?.age || 'Not specified'}</Text>
      </VStack>

      <Divider mt={6} />

      <Button
        as={RouterLink}
        to="/edit-profile"
        colorScheme="teal"
        size="lg"
        width={{ base: "100%", md: "100%" }}
        height={{ base: "46px", md: "46px" }}
        fontSize={{ base: "md", md: "lg" }}
        leftIcon={<EditIcon />}
        mb={6}
      >
        Edit Profile
      </Button>


      <Divider mt={6} />
      <Flex justify="center" width="100%" mb={6}>
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          width="100%"
          align="center"
        >
          <Button
            as={RouterLink}
            to="/create-post"
            colorScheme="blue"
            leftIcon={<AddIcon />}
            width={{ base: "100%", md: "50%" }}
            height={{ base: "46px", md: "46px" }}
            fontSize={{ base: "md", md: "lg" }}
          >
            Create Post
          </Button>

          <Button
            as={RouterLink}
            to="/create-job"
            colorScheme="purple"
            leftIcon={<FaBriefcase />}
            width={{ base: "100%", md: "50%" }}
            height={{ base: "46px", md: "46px" }}
            fontSize={{ base: "md", md: "lg" }}
          >
            Create Job
          </Button>
        </Flex>
      </Flex>


      <Divider mt={6} />

      <Heading size="md" my={4}>My Posts</Heading>
      <VStack spacing={4} align="stretch">
        {posts.map((post) => (
          <Box
            key={post.id}
            p={4}
            borderWidth={1}
            borderRadius="md"
            boxShadow="sm"
            bg={bg}
            borderColor={borderColor}
          >
            <Text>{post.content}</Text>
            <Text fontSize="sm" color="gray.500">{post.date}</Text>
            <PostActions post={post} onComment={handleComment} onLike={handleLike} />
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Account</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Text>You want sure delete account</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme='red'
              mr={3}
              onClick={handleDeleteAccount}
              isLoading={isDeleteingAccount}
              loadingText="deleting"
            >Delete</Button>
            <Button variant="ghost" onClick={onClose} isDisabled={isDeleteingAccount}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


      <Modal isOpen={isImageOpen} onClose={onImageClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Profile image</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Image
              src={user.profileImage}
              alt='Profile image'
              maxH="70vh"
              objectFit="contain"
              mx="auto"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onImageClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default Profile;