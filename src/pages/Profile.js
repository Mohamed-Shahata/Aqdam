import { Avatar, Box, Button, Center, Container, Divider, Flex, Heading, IconButton, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalOverlay, Spinner, Text, useColorModeValue, useDisclosure, useToast, VStack } from '@chakra-ui/react'
import React, { useContext, useEffect, useState } from 'react'
import PostActions from '../components/PostActions'
import { AuthContext } from '../AuthContext';
import { useNavigate, Link as RouterLink, useParams } from 'react-router-dom';
import api from '../api';
import { AddIcon, EditIcon, SettingsIcon } from "@chakra-ui/icons"
import { FaBriefcase } from 'react-icons/fa';

const Profile = () => {

  const { user } = useContext(AuthContext);

  const [posts, setPosts] = useState([
    { id: 1, user: "ahmed", content: "beta post", date: "2025-04-14", likes: 0, hasLiked: false, comments: [] },
  ]);

  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        let userData;
        if (id) {
          const response = await api.get(`/users/${id}`);
          userData = response.data;
        } else {
          userData = user;
        }
        setProfileUser(userData);

        const followersResponse = await api.post(`/users/${Number(userData.id)}/followers`);
        const followingResponse = await api.post(`/users/${Number(userData.id)}/following`);
        setFollowersCount(followersResponse.data.length);
        setFollowingCount(followingResponse.data.length);

        // Check if the logged-in user is following this profile
        if (id && Number(id) !== Number(user.id)) {
          const isFollowing = followersResponse.data.some(follower => Number(follower.id) === Number(user.id));
          setIsFollowing(isFollowing);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Something went wrong"
        toast({
          title: "Error",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true
        })
        navigate("/profile")
      } finally {
        setIsLoading(false);
      }
    }
    if (user) {
      fetchProfile();
    }
  }, [id, user, toast, navigate])

  const handleFollow = async () => {
    try {
      await api.post(`/users/follow/${id}`);
      setIsFollowing(!isFollowing);
      toast({
        title: 'Success',
        description: isFollowing ? 'Unfollowed user.' : 'Followed user.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      window.location.reload();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update follow status.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
  };

  const handleNavegateFollowing = () => {
    if (!id) {
      return navigate(`/profile/${user.id}/following`)
    }
    navigate(`/profile/${id}/following`)
  }

  const handleNavegateFollowers = () => {
    if (!id) {
      return navigate(`/profile/${user.id}/followers`)
    }
    navigate(`/profile/${id}/followers`)
  }

  if (isLoading || !profileUser) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  const isOwnerProfile = !Number(id) || Number(id) === Number(user.id);

  return (
    <Container maxW="container.md" py={8}>
      {isOwnerProfile && (
        <Flex justify="flex-end" mb={4}>
          <IconButton
            as={RouterLink}
            to="/settings"
            icon={<SettingsIcon boxSize={6} />}
            aria-label='Settings'
            variant="ghost"
          />
        </Flex>
      )}
      <Flex direction={{ base: "column", md: "row" }} align={{ base: "center", md: "start" }} mb={6}>
        <Avatar
          size="xl"
          src={profileUser?.profileImage}
          mb={{ base: 4, md: 0 }}
          cursor={profileUser?.profileImage ? 'pointer' : 'default'}
          onClick={profileUser?.profileImage ? onImageOpen : undefined}
        />
        <Box ml={{ base: 0, md: 4 }} textAlign={{ base: "center", md: "left" }}>
          <Text fontSize="2xl" fontWeight="bold">{profileUser.firstName} {profileUser.lastName}</Text>
          <Flex mt={2} gap={6} justify={{ base: 'center', md: 'flex-start' }}>
            <Text fontSize="md" onClick={handleNavegateFollowers} cursor="pointer">
              <Text as="span" fontWeight="bold">{followersCount}</Text> Followers
            </Text>
            <Text fontSize="md" onClick={handleNavegateFollowing} cursor="pointer">
              <Text as="span" fontWeight="bold">{followingCount}</Text> Following
            </Text>
          </Flex>
          {!isOwnerProfile && (
            <Button
              mt={4}
              colorScheme={isFollowing ? 'gray' : 'teal'}
              onClick={handleFollow}
              size="md"
              width={{ base: 'full', md: 'auto' }}
              borderRadius="md"
              px={6}
              py={2}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </Box>
      </Flex>
      <VStack align="center" spacing={2} mb={6}>
        <Text>{profileUser?.bio || ''}</Text>
        {/* <Text>{profileUser?.age || ''}</Text> */}
      </VStack>

      <Divider mt={6} />

      {isOwnerProfile && (
        <>
          <Button
            as={RouterLink}
            to="/edit-profile"
            colorScheme="teal"
            size="lg"
            width={{ base: "100%", md: "100%" }}
            height={{ base: "40px", md: "40px" }}
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
                height={{ base: "40px", md: "40px" }}
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
                height={{ base: "40px", md: "40px" }}
                fontSize={{ base: "md", md: "lg" }}
              >
                Create Job
              </Button>
            </Flex>
          </Flex>
          <Divider mt={6} />
        </>
      )}

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

      <Modal isOpen={isImageOpen} onClose={onImageClose} size="full">
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" fontSize="xl" />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
            <Image
              src={profileUser.profileImage}
              alt='Profile image'
              maxH="90vh"
              maxW="90vw"
              objectFit="contain"
              borderRadius="md"
              shadow="lg"
            />
          </ModalBody>
          <ModalFooter justifyContent="center" bg="transparent" gap={4}>
            <Button variant="solid" colorScheme="teal" onClick={onImageClose}>
              Close
            </Button>

            <a href={profileUser.profileImage} download target="_blank" rel="noopener noreferrer">
              <Button variant="solid" colorScheme="blue">
                Download
              </Button>
            </a>
          </ModalFooter>
        </ModalContent>
      </Modal>


    </Container>
  )
}

export default Profile;