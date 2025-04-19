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
import { AuthContext } from '../AuthContext';
import { useNavigate, Link as RouterLink, useParams, Link } from 'react-router-dom';
import api from '../api';
import { AddIcon, EditIcon, HamburgerIcon, SettingsIcon, StarIcon } from '@chakra-ui/icons';
import { FaBookOpen, FaBriefcase, FaHeart, FaRegHeart } from 'react-icons/fa';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { IoSparkles } from 'react-icons/io5';
import { FaGem, FaCrown } from 'react-icons/fa';
import { MdWork } from "react-icons/md"

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemIdToDelete, setItemIdToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'job' or 'post'
  const [jobs, setJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]); // Only for jobs
  const [userReactions, setUserReactions] = useState({});
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
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

        // Fetch user's posts
        const postsResponse = await api.get(`/posts/user/${Number(userData.id)}`);
        setPosts(postsResponse.data);

        // Fetch user's job favorites
        if (user) {
          const jobFavoritesResponse = await api.post('/jobs/favorites/me');
          setFavorites(jobFavoritesResponse.data.map(fav => fav.id));
        }

        // Fetch user reactions
        const reactionsResponse = await api.get('/posts/reactions/me');
        const userReactionsData = Array.isArray(reactionsResponse.data)
          ? reactionsResponse.data.reduce((acc, reaction) => {
            acc[reaction.postId] = reaction.type;
            return acc;
          }, {})
          : {};
        setUserReactions(userReactionsData);

        // Fetch reaction counts for all posts
        const reactionCountsData = {};
        await Promise.all(
          postsResponse.data.map(async (post) => {
            try {
              const reactionResponse = await api.get(`/posts/${post.id}/reactions`);
              reactionCountsData[post.id] = {
                benefited: reactionResponse.data.benefited || 0,
                not_benefited: reactionResponse.data.not_benefited || 0,
              };
            } catch (error) {
              console.error(`Failed to fetch reactions for post ${post.id}:`, error);
              reactionCountsData[post.id] = { benefited: 0, not_benefited: 0 };
            }
          })
        );
        setReactionCounts(reactionCountsData);
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

  const handleDelete = async (id, type) => {
    try {
      if (type === 'job') {
        await api.delete(`/jobs/${id}`);
        setJobs(jobs.filter((job) => job.id !== id));
      } else if (type === 'post') {
        await api.delete(`/posts/${id}`);
        setPosts(posts.filter((post) => post.id !== id));
      }
      toast({
        title: 'Success',
        description: `${type === 'job' ? 'Job' : 'Post'} deleted successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to delete ${type === 'job' ? 'job' : 'post'}.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFavorite = async (jobId) => {
    try {
      if (favorites.includes(jobId)) {
        await api.delete(`/jobs/favorites/${Number(jobId)}`);
        setFavorites(favorites.filter((id) => Number(id) !== Number(jobId)));
        toast({
          title: 'Success',
          description: 'Removed from job favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await api.post('/jobs/favorites', { jobId: Number(jobId) });
        setFavorites([...favorites, Number(jobId)]);
        toast({
          title: 'Success',
          description: 'Added to job favorites.',
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

  const openDeleteModal = (id, type) => {
    setItemIdToDelete(id);
    setDeleteType(type);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemIdToDelete(null);
    setDeleteType(null);
  };

  const confirmDelete = async () => {
    if (itemIdToDelete && deleteType) {
      await handleDelete(itemIdToDelete, deleteType);
    }
    closeDeleteModal();
  };

  const handleReaction = async (postId, type) => {
    try {
      const currentReaction = userReactions[postId];
      if (currentReaction === type) {
        // Remove reaction
        await api.delete(`/posts/${postId}/reaction`);
        setUserReactions((prev) => {
          const newReactions = { ...prev };
          delete newReactions[postId];
          return newReactions;
        });
        setReactionCounts((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            [type]: (prev[postId]?.[type] || 1) - 1,
          },
        }));
        toast({
          title: 'Success',
          description: 'Reaction removed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Add or update reaction
        await api.post(`/posts/${postId}/reaction`, { type });
        setUserReactions((prev) => ({ ...prev, [postId]: type }));
        setReactionCounts((prev) => {
          const currentCounts = prev[postId] || { benefited: 0, not_benefited: 0 };
          return {
            ...prev,
            [postId]: {
              benefited:
                type === 'benefited'
                  ? currentCounts.benefited + 1
                  : currentReaction === 'benefited'
                    ? currentCounts.benefited - 1
                    : currentCounts.benefited,
              not_benefited:
                type === 'not_benefited'
                  ? currentCounts.not_benefited + 1
                  : currentReaction === 'not_benefited'
                    ? currentCounts.not_benefited - 1
                    : currentCounts.not_benefited,
            },
          };
        });
        toast({
          title: 'Success',
          description: `Marked as ${type === 'benefited' ? 'Benefited' : 'Not Benefited'}.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Reaction Error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to manage reaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };


  const renderResources = (resources) => {
    const items = stringToList(resources);
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return items.map((item, index) => {
      const parts = item.split(urlRegex).filter(Boolean);
      return (
        <ListItem key={index}>
          {parts.map((part, i) =>
            urlRegex.test(part) ? (
              <Link
                key={i}
                href={part}
                isExternal
                color="teal.500"
                _hover={{ textDecoration: 'underline' }}
              >
                {part}
              </Link>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </ListItem>
      );
    });
  };

  const handleToggleContent = (postId) => {
    setExpandedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
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
        <Flex justifyContent="space-between" mb={4}>
          <Box>
          </Box>
          <Box>
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
          </Box>

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
          <Text mt={5}>
            <Text as="span" fontWeight="bold" color="teal" fontSize={20} >Point
              <Text as="span" color="yellow.500"> {profileUser.point}</Text>
            </Text>
          </Text>
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

      {
        isOwnerProfile && (
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
                  to="/create-job"
                  colorScheme="purple"
                  leftIcon={<FaBriefcase />}
                  width={{ base: '100%', md: '50%' }}
                  height={{ base: '40px', md: '40px' }}
                  fontSize={{ base: 'md', md: 'lg' }}
                >
                  Create Job
                </Button>

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
              </Flex>
            </Flex>
            <Divider mt={6} />
          </>
        )
      }

      <Tabs colorScheme="teal" mb={6}>
        <TabList>
          <Tab flex={1}><MdWork size={25} /></Tab>
          <Tab flex={1}><FaBookOpen size={25} /></Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {jobs.length === 0 ? (
              <Text>No jobs available yet.</Text>
            ) : (
              <VStack spacing={6} align="stretch">
                {jobs.map((job) => (
                  <Box
                    key={`job-${job.id}`}
                    p={8}
                    minHeight="240px"
                    borderWidth={1}
                    borderRadius="md"
                    boxShadow="sm"
                    bg={bg}
                    borderColor={borderColor}
                    position="relative"
                  >
                    {user && (
                      <>
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
                                <MenuItem as={RouterLink} to={`/edit-job/${job.id}`}>
                                  Edit
                                </MenuItem>
                                <MenuItem onClick={() => openDeleteModal(job.id, 'job')}>
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
                        <IconButton
                          icon={favorites.includes(job.id) ? <FaHeart /> : <FaRegHeart />}
                          variant="ghost"
                          size="sm"
                          position="absolute"
                          top={4}
                          right={12}
                          aria-label={favorites.includes(job.id) ? 'Remove from favorites' : 'Add to favorites'}
                          color={favorites.includes(job.id) ? 'teal.500' : 'gray.500'}
                          _hover={{ color: 'teal.600' }}
                          onClick={() => handleFavorite(job.id)}
                        />
                      </>
                    )}
                    <Flex align="center" mb={6}>
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
                    {job.email_applay && (
                      <Flex justifyContent="center">
                        <Button
                          as="a"
                          href={`mailto:${job.email_applay}?subject=Job Application - ${encodeURIComponent(job.title)}`}
                          colorScheme="teal"
                          size="lg"
                          width={{ base: 'full', md: '80%' }}
                          height={{ base: '40px', md: '40px' }}
                          borderRadius="md"
                          mt={2}
                          mb={4}
                        >
                          Apply via Email
                        </Button>
                      </Flex>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
          <TabPanel>
            {posts.map((post) => (
              <Box
                key={`post-${post.id}`}
                p={8}
                minHeight="240px"
                borderWidth={1}
                borderRadius="md"
                boxShadow="sm"
                bg={bg}
                borderColor={borderColor}
                position="relative"
              >
                {user && Number(post.user?.id) === Number(user.id) && (
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<HamburgerIcon />}
                      variant="ghost"
                      size="sm"
                      position="absolute"
                      top={4}
                      right={4}
                      aria-label="Post options"
                    />
                    <MenuList>
                      <MenuItem as={RouterLink} to={`/edit-post/${post.id}`}>
                        Edit
                      </MenuItem>
                      <MenuItem
                        onClick={async () => {
                          try {
                            await api.delete(`/posts/${post.id}`);
                            setPosts(posts.filter((p) => p.id !== post.id));
                            toast({
                              title: 'Success',
                              description: 'Post deleted successfully.',
                              status: 'success',
                              duration: 5000,
                              isClosable: true,
                            });
                          } catch (error) {
                            toast({
                              title: 'Error',
                              description: error.response?.data?.message || 'Failed to delete post.',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            });
                          }
                        }}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                )}
                <Flex align="center" mb={6}>
                  <Avatar size="md" src={post.user?.profileImage} mr={3} />
                  <Box>
                    <Link
                      as={RouterLink}
                      to={`/profile/${post.user?.id}`}
                      fontWeight="bold"
                      color="teal.500"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {post.user?.firstName} {post.user?.lastName}
                    </Link>
                    <Text fontSize="sm" color="gray.500">
                      {format(new Date(post.createdAt), 'hh:mm a')} -{' '}
                      {dayjs(post.createdAt).format('YYYY-MM-DD')}
                    </Text>
                  </Box>
                </Flex>
                <Heading
                  size="lg"
                  mb={4}
                  as={RouterLink}
                  to={`/posts/${post.id}`}
                  color="teal.500"
                  _hover={{ textDecoration: 'underline' }}
                >
                  {post.title}
                </Heading>
                {post.content && (
                  <Box mb={6}>
                    <Text fontWeight="semibold" mb={2}>
                      Content
                    </Text>
                    <Text color={textColor} whiteSpace="pre-wrap">
                      {expandedPosts.includes(post.id)
                        ? post.content
                        : truncateText(post.content, 200)}
                      {post.content.length > 200 && (
                        <Link
                          color="teal.500"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={() => handleToggleContent(post.id)}
                          ml={2}
                        >
                          {expandedPosts.includes(post.id) ? 'Show Less' : 'More'}
                        </Link>
                      )}
                    </Text>
                  </Box>
                )}
                {post.resources && (
                  <Box mb={6}>
                    <Text fontWeight="semibold" mb={2}>
                      Resources
                    </Text>
                    <UnorderedList color={textColor} spacing={2}>
                      {renderResources(post.resources)}
                    </UnorderedList>
                  </Box>
                )}
                {user && (
                  <Box>
                    <Flex gap={2} mb={2}>
                      <Button
                        colorScheme="green"
                        size="sm"
                        flex="1"
                        opacity={
                          userReactions[post.id] && userReactions[post.id] !== 'benefited' ? 0.5 : 1
                        }
                        onClick={() => handleReaction(post.id, 'benefited')}
                      >
                        Benefited {reactionCounts[post.id]?.benefited > 0 ? `(${reactionCounts[post.id].benefited})` : ''}
                      </Button>
                      <Button
                        colorScheme="red"
                        size="sm"
                        variant="outline"
                        flex="1"
                        opacity={
                          userReactions[post.id] && userReactions[post.id] !== 'not_benefited' ? 0.5 : 1
                        }
                        onClick={() => handleReaction(post.id, 'not_benefited')}
                      >
                        Not Benefited{' '}
                        {reactionCounts[post.id]?.not_benefited > 0
                          ? `(${reactionCounts[post.id].not_benefited})`
                          : ''}
                      </Button>
                    </Flex>
                    <Flex gap={4}>
                      <Text fontSize="sm" color="teal.500">
                        Benefited: {reactionCounts[post.id]?.benefited || 0}
                      </Text>
                      <Text fontSize="sm" color="red.500">
                        Not Benefited: {reactionCounts[post.id]?.not_benefited || 0}
                      </Text>
                    </Flex>
                  </Box>
                )}
              </Box>
            ))}
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
            <Text>Are you sure you want to delete this {deleteType === 'job' ? 'job' : 'post'}?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container >
  );
};

export default Profile;