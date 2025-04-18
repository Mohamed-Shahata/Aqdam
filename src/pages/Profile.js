import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Heading,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  UnorderedList,
  ListItem,
  MenuItem,
  MenuList,
  MenuButton,
  Menu,
  ModalHeader,
  Icon,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import PostActions from '../components/PostActions';
import { AuthContext } from '../AuthContext';
import { useNavigate, Link as RouterLink, useParams, Link } from 'react-router-dom';
import api from '../api';
import { AddIcon, EditIcon, HamburgerIcon, SettingsIcon, StarIcon } from '@chakra-ui/icons';
import { FaBriefcase } from 'react-icons/fa';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { IoSparkles } from 'react-icons/io5';
import { FaGem, FaCrown } from 'react-icons/fa';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [posts, setPosts] = useState([
    { id: 1, user: 'ahmed', content: 'beta post', date: '2025-04-14', likes: 0, hasLiked: false, comments: [] },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchProfileAndFavorites = async () => {
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

        if (id && Number(id) !== Number(user.id)) {
          const isFollowing = followersResponse.data.some(follower => Number(follower.id) === Number(user.id));
          setIsFollowing(isFollowing);
        }

        // Fetch user's jobs
        const jobsResponse = await api.get(`/jobs/user/${Number(userData.id)}`);
        setJobs(jobsResponse.data);

        // Fetch user's favorites
        if (user) {
          const favoritesResponse = await api.post('/jobs/favorites/me');
          setFavorites(favoritesResponse.data.map(fav => fav.id));
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Something went wrong';
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/profile');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchProfileAndFavorites();
    }
  }, [id, user, toast, navigate]);

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
          return { ...post, likes: post.likes - 1, hasLiked: false };
        } else {
          return { ...post, likes: post.likes + 1, hasLiked: true };
        }
      }
      return post;
    }));
  };

  const handleComment = (postId, comment) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
    ));
  };

  const handleNavegateFollowing = () => {
    if (!id) {
      return navigate(`/profile/${user.id}/following`);
    }
    navigate(`/profile/${id}/following`);
  };

  const handleNavegateFollowers = () => {
    if (!id) {
      return navigate(`/profile/${user.id}/followers`);
    }
    navigate(`/profile/${id}/followers`);
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
        // Remove from favorites
        await api.delete(`/jobs/favorites/${Number(jobId)}`);
        setFavorites(favorites.filter(id => Number(id) !== Number(jobId)));
        toast({
          title: 'Success',
          description: 'Removed from favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Add to favorites
        await api.post('/jobs/favorites', { jobId: Number(jobId) });
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

  if (isLoading || !profileUser) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
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
            aria-label="Settings"
            variant="ghost"
            _hover={{ bg: "teal.900" }}
          />
          <IconButton
            as={RouterLink}
            to="/favorites"
            color="yellow.400"
            icon={<StarIcon boxSize={6} />}
            aria-label="favorites"
            variant="ghost"
            _hover={{ bg: "teal.900", borderColor: 'yellow.500' }}
          />
        </Flex>
      )}
      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'start' }} mb={6}>
        <Avatar
          size="xl"
          src={profileUser?.profileImage}
          mb={{ base: 4, md: 0 }}
          cursor={profileUser?.profileImage ? 'pointer' : 'default'}
          onClick={profileUser?.profileImage ? onImageOpen : undefined}
        />
        <Box ml={{ base: 0, md: 4 }} textAlign={{ base: 'center', md: 'left' }}>
          <Text fontSize="2xl" fontWeight="bold">
            {profileUser.firstName} {profileUser.lastName}
            {profileUser?.point >= 100 && (
              <Icon
                as={
                  profileUser.point >= 10000
                    ? FaCrown
                    : profileUser.point >= 1000
                      ? FaGem
                      : IoSparkles
                }
                ml={2}
                mb={-1}
                color={
                  profileUser.point >= 10000
                    ? 'yellow.500'
                    : profileUser.point >= 1000
                      ? 'purple.400'
                      : "blue.500"
                }

                boxSize={profileUser.point >= 10000 ? 7 : profileUser.point >= 1000 ? 6 : 6}
                transition="color 0.2s"
                aria-label={
                  profileUser.point >= 10000
                    ? 'Elite Badge'
                    : profileUser.point >= 1000
                      ? 'Pro Badge'
                      : 'Verified Badge'
                }
              />
            )}
          </Text>
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
      </VStack>

      <Divider mt={6} />

      {isOwnerProfile && (
        <>
          <Button
            as={RouterLink}
            to="/edit-profile"
            colorScheme="teal"
            size="lg"
            width={{ base: '100%', md: '100%' }}
            height={{ base: '40px', md: '40px' }}
            fontSize={{ base: 'md', md: 'lg' }}
            leftIcon={<EditIcon />}
            mb={6}
          >
            Edit Profile
          </Button>

          <Divider mt={6} />
          <Flex justify="center" width="100%" mb={6}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              width="100%"
              align="center"
            >
              <Button
                as={RouterLink}
                to="/create-post"
                colorScheme="blue"
                leftIcon={<AddIcon />}
                width={{ base: '100%', md: '50%' }}
                height={{ base: '40px', md: '40px' }}
                fontSize={{ base: 'md', md: 'lg' }}
              >
                Create Post
              </Button>

              <Button
                as={RouterLink}
                to="/create-job"
                colorScheme="purple"
                leftIcon={<FaBriefcase />}
                width={{ base: '100%', md: '50%' }}
                height={{ base: '40px', md: '40px' }}
                fontSize={{ base: 'md', md: 'lg' }}
              >
                Create Job
              </Button>
            </Flex>
          </Flex>
          <Divider mt={6} />
        </>
      )}

      <Tabs colorScheme="teal" mb={6}>
        <TabList>
          <Tab flex={1}>Jobs</Tab>
          <Tab flex={1}>Posts</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
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
                            <MenuItem onClick={() => handleFavorite(job.id)}>
                              {favorites.includes(job.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                            </MenuItem>
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
          </TabPanel>
          <TabPanel>
            {posts.length === 0 ? (
              <Text>No posts available yet.</Text>
            ) : (
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
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={isImageOpen} onClose={onImageClose} size="full">
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" fontSize="xl" />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
            <Image
              src={profileUser.profileImage}
              alt="Profile image"
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

export default Profile;