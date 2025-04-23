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
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate, Link as RouterLink, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { AddIcon, EditIcon, HamburgerIcon, SettingsIcon, StarIcon } from '@chakra-ui/icons';
import { FaBookOpen, FaBriefcase } from 'react-icons/fa';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { IoSparkles } from 'react-icons/io5';
import { FaGem, FaCrown } from 'react-icons/fa';
import { MdThumbDown, MdThumbUp, MdWork } from 'react-icons/md';
import InfiniteScroll from 'react-infinite-scroll-component';
import maleProfile from "../pages/gender/male.jpg";
import femaleProfile from "../pages/gender/female.jpg";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemIdToDelete, setItemIdToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const limit = 5;
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch profile user
  const { data: profileUser, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['profileUser', id || user?.id],
    queryFn: async () => {
      if (id) {
        const response = await api.get(`/users/${id}`);
        return response.data;
      }
      return user;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error('Profile fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Fetch followers and following counts
  const { data: followers = [], isLoading: isFollowersLoading } = useQuery({
    queryKey: ['followers', profileUser?.id],
    queryFn: async () => {
      const response = await api.post(`/users/${Number(profileUser.id)}/followers`);
      return response.data;
    },
    enabled: !!profileUser?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const { data: following = [], isLoading: isFollowingLoading } = useQuery({
    queryKey: ['following', profileUser?.id],
    queryFn: async () => {
      const response = await api.post(`/users/${Number(profileUser.id)}/following`);
      return response.data;
    },
    enabled: !!profileUser?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const isFollowing = followers.some((follower) => Number(follower.id) === Number(user?.id));

  // Fetch user's jobs with pagination
  const { data: jobsResponse, isLoading: isJobsLoading, error: jobsError } = useQuery({
    queryKey: ['jobs', profileUser?.id, jobsPage],
    queryFn: async () => {
      const response = await api.get(`/jobs/user/${Number(profileUser.id)}?page=${jobsPage}&limit=${limit}`);
      return response.data; // Return the full response object
    },
    enabled: !!profileUser?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error('Jobs fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Fetch user's posts with pagination
  const { data: postsResponse, isLoading: isPostsLoading, error: postsError } = useQuery({
    queryKey: ['posts', profileUser?.id, postsPage],
    queryFn: async () => {
      const response = await api.get(`/posts/user/${Number(profileUser.id)}`);
      return response.data; // Return the full response object
    },
    enabled: !!profileUser?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error('Posts fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Update jobs when new data is fetched
  useEffect(() => {
    if (jobsResponse?.data?.length > 0) {
      setJobs((prev) => {
        const newJobs = [...prev, ...jobsResponse.data];
        const uniqueJobs = Array.from(new Map(newJobs.map((job) => [job.id, job])).values());
        return uniqueJobs;
      });
      setHasMoreJobs(jobsResponse.currentPage < jobsResponse.totalPages);
    } else {
      setHasMoreJobs(false);
    }
  }, [jobsResponse]);

  // Update posts when new data is fetched
  useEffect(() => {
    if (postsResponse?.data?.length > 0) {
      setPosts((prev) => {
        const newPosts = [...prev, ...postsResponse.data];
        const uniquePosts = Array.from(new Map(newPosts.map((post) => [post.id, post])).values());
        return uniquePosts;
      });
      setHasMorePosts(postsResponse.currentPage < postsResponse.totalPages);
    } else {
      setHasMorePosts(false);
    }
  }, [postsResponse]);

  // Fetch user's job favorites
  const { data: favorites = [], isLoading: isFavoritesLoading, refetch } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const response = await api.post('/jobs/favorites/me');
      return response.data.map((fav) => Number(fav.id));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // Fetch user reactions
  const { data: userReactions = {}, isLoading: isReactionsLoading } = useQuery({
    queryKey: ['userReactions', user?.id],
    queryFn: async () => {
      const response = await api.get('/posts/reactions/me');
      return Array.isArray(response.data)
        ? response.data.reduce((acc, reaction) => {
          acc[reaction.postId] = reaction.type;
          return acc;
        }, {})
        : {};
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Fetch reaction counts for posts
  const { data: reactionCounts = {}, isLoading: isReactionCountsLoading } = useQuery({
    queryKey: ['reactionCounts', posts.map((post) => post.id)],
    queryFn: async () => {
      const reactionCountsData = {};
      await Promise.all(
        posts.map(async (post) => {
          try {
            const response = await api.get(`/posts/${post.id}/reactions`);
            reactionCountsData[post.id] = {
              benefited: response.data.benefited || 0,
              not_benefited: response.data.not_benefited || 0,
            };
          } catch (error) {
            console.error(`Error fetching reactions for post ${post.id}:`, error);
            reactionCountsData[post.id] = { benefited: 0, not_benefited: 0 };
          }
        })
      );
      return reactionCountsData;
    },
    enabled: !!posts.length,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Mutation for following/unfollowing
  const followMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/users/follow/${id}`);
    },
    onSuccess: () => {
      queryClient.setQueryData(['followers', profileUser?.id], (old) => {
        if (isFollowing) {
          return old.filter((follower) => Number(follower.id) !== Number(user.id));
        }
        return [...old, { id: user.id, firstName: user.firstName, lastName: user.lastName }];
      });
      toast({
        title: 'Success',
        description: isFollowing ? 'Unfollowed user.' : 'Followed user.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update follow status.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for deleting job or post
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      if (type === 'job') {
        await api.delete(`/jobs/${id}`);
      } else if (type === 'post') {
        await api.delete(`/posts/${id}`);
      }
    },
    onSuccess: (_, { id, type }) => {
      if (type === 'job') {
        setJobs((prev) => prev.filter((job) => job.id !== id));
      } else if (type === 'post') {
        setPosts((prev) => prev.filter((post) => post.id !== id));
      }
      toast({
        title: 'Success',
        description: `${type === 'job' ? 'Job' : 'Post'} deleted successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to delete ${deleteType === 'job' ? 'job' : 'post'}.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for handling favorites
  const favoriteMutation = useMutation({
    mutationFn: async (jobId) => {
      if (favorites.includes(jobId)) {
        await api.delete(`/jobs/favorites/${Number(jobId)}`);
      } else {
        await api.post('/jobs/favorites', { jobId: Number(jobId) });
      }
    },
    onMutate: async (jobId) => {
      await queryClient.cancelQueries(['favorites', user?.id]);
      const previousFavorites = queryClient.getQueryData(['favorites', user?.id]);
      queryClient.setQueryData(['favorites', user?.id], (old) =>
        favorites.includes(jobId)
          ? old.filter((id) => Number(id) !== Number(jobId))
          : [...old, Number(jobId)]
      );
      return { previousFavorites };
    },
    onError: (error, jobId, context) => {
      queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(['favorites', user?.id]);
    },
  });

  // Mutation for handling reactions
  const reactionMutation = useMutation({
    mutationFn: async ({ postId, type }) => {
      const currentReaction = userReactions[postId];
      if (currentReaction === type) {
        await api.delete(`/posts/${postId}/reaction`);
      } else {
        await api.post(`/posts/${postId}/reaction`, { type });
      }
    },
    onMutate: async ({ postId, type }) => {
      await queryClient.cancelQueries(['userReactions', user?.id]);
      await queryClient.cancelQueries(['reactionCounts']);
      const previousReactions = queryClient.getQueryData(['userReactions', user?.id]);
      const previousCounts = queryClient.getQueryData(['reactionCounts']);
      const currentReaction = userReactions[postId];

      // Update user reactions
      queryClient.setQueryData(['userReactions', user?.id], (old) => {
        const newReactions = { ...old };
        if (currentReaction === type) {
          delete newReactions[postId];
        } else {
          newReactions[postId] = type;
        }
        return newReactions;
      });

      // Update reaction counts instantly
      queryClient.setQueryData(['reactionCounts'], (old) => {
        const currentCounts = old?.[postId] || { benefited: 0, not_benefited: 0 };
        let newBenefited = currentCounts.benefited;
        let newNotBenefited = currentCounts.not_benefited;

        if (currentReaction === type) {
          // Remove reaction
          if (type === 'benefited') {
            newBenefited = Math.max(0, currentCounts.benefited - 1);
          } else {
            newNotBenefited = Math.max(0, currentCounts.not_benefited - 1);
          }
        } else if (!currentReaction) {
          // New reaction
          if (type === 'benefited') {
            newBenefited = currentCounts.benefited + 1;
          } else {
            newNotBenefited = currentCounts.not_benefited + 1;
          }
        } else {
          // Switch reaction
          if (type === 'benefited') {
            newBenefited = currentCounts.benefited + 1;
            newNotBenefited = Math.max(0, currentCounts.not_benefited - 1);
          } else {
            newNotBenefited = currentCounts.not_benefited + 1;
            newBenefited = Math.max(0, currentCounts.benefited - 1);
          }
        }

        return {
          ...old,
          [postId]: {
            benefited: newBenefited,
            not_benefited: newNotBenefited,
          },
        };
      });

      return { previousReactions, previousCounts };
    },
    onError: (error, { postId }, context) => {
      queryClient.setQueryData(['userReactions', user?.id], context.previousReactions);
      queryClient.setQueryData(['reactionCounts'], context.previousCounts);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update reaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries(['userReactions', user?.id]);
      queryClient.invalidateQueries(['reactionCounts']);
    },
  });

  const handleFollow = () => {
    followMutation.mutate();
  };

  const handleNavegateFollowing = () => {
    navigate(`/profile/${id || user.id}/following`);
  };

  const handleNavegateFollowers = () => {
    navigate(`/profile/${id || user.id}/followers`);
  };

  const stringToList = (str) => {
    if (!str) return [];
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
  };

  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleFavorite = (jobId) => {
    favoriteMutation.mutate(jobId);
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

  const confirmDelete = () => {
    if (itemIdToDelete && deleteType) {
      deleteMutation.mutate({ id: itemIdToDelete, type: deleteType });
    }
    closeDeleteModal();
  };

  const handleReaction = (postId, type) => {
    reactionMutation.mutate({ postId, type });
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

  const loadMoreJobs = () => {
    if (hasMoreJobs && !isJobsLoading) {
      setJobsPage((prev) => prev + 1);
    }
  };

  const loadMorePosts = () => {
    if (hasMorePosts && !isPostsLoading) {
      setPostsPage((prev) => prev + 1);
    }
  };

  // Check if profile failed to load
  if (profileError || !profileUser) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Check if still loading
  if (
    isProfileLoading ||
    isFollowersLoading ||
    isFollowingLoading ||
    isFavoritesLoading ||
    isReactionsLoading ||
    isReactionCountsLoading
  ) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  const isOwnerProfile = !id || Number(id) === Number(user.id);

  return (
    <Container maxW="container.md" py={8}>
      {isOwnerProfile && (
        <Flex justifyContent="space-between" mb={4}>
          <Box />
          <Box>
            <IconButton
              as={RouterLink}
              to="/settings"
              icon={<SettingsIcon boxSize={6} />}
              aria-label="Settings"
              variant="ghost"
              _hover={{ bg: 'teal.900' }}
            />
            <IconButton
              as={RouterLink}
              to="/favorites"
              color="yellow.400"
              icon={<StarIcon boxSize={6} />}
              aria-label="favorites"
              variant="ghost"
              _hover={{ bg: 'teal.900', borderColor: 'yellow.500' }}
            />
          </Box>
        </Flex>
      )}
      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'start' }} mb={6}>
        <Avatar
          size="xl"
          src={
            profileUser?.profileImage
              ? profileUser.profileImage
              : profileUser?.gender === 'male'
                ? maleProfile
                : femaleProfile
          }
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
                      : 'blue.500'
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
              <Text as="span" fontWeight="bold">{followers.length}</Text> Followers
            </Text>
            <Text fontSize="md" onClick={handleNavegateFollowing} cursor="pointer">
              <Text as="span" fontWeight="bold">{following.length}</Text> Following
            </Text>
          </Flex>
          <Text mt={5}>
            <Text as="span" fontWeight="bold" color="teal" fontSize={20}>
              Point
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
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} width="100%" align="center">
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
      )}
      <Tabs colorScheme="teal" mb={6}>
        <TabList>
          <Tab flex={1}>
            <MdWork size={25} />
          </Tab>
          <Tab flex={1}>
            <FaBookOpen size={25} />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {jobsError ? (
              <Text textAlign="center" color="red.500">
                Failed to load jobs. Please try again.
              </Text>
            ) : jobs.length === 0 && !isJobsLoading ? (
              <Text textAlign="center">No jobs available yet.</Text>
            ) : (
              <InfiniteScroll
                dataLength={jobs.length}
                next={loadMoreJobs}
                hasMore={hasMoreJobs}
                loader={<Center py={4}><Spinner size="lg" /></Center>}
                endMessage={<Text textAlign="center" py={4}>No more jobs to load.</Text>}
              >
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
                            icon={favorites.includes(job.id) ? <StarIcon color="yellow.500" /> : <StarIcon />}
                            isLoading={favoriteMutation.isLoading}
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            top={4}
                            right={12}
                            aria-label={favorites.includes(job.id) ? 'Remove from favorites' : 'Add to favorites'}
                            color={favorites.includes(job.id) ? 'teal.500' : 'gray.500'}
                            _hover={{ color: "yellow.100" }}
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
                            {format(new Date(job.createdAt), 'hh:mm a')} -{' '}
                            {dayjs(job.createdAt).format('YYYY-MM-DD')}
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
                            href={`mailto:${job.email_applay}?subject=Job Application - ${encodeURIComponent(
                              job.title
                            )}`}
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
              </InfiniteScroll>
            )}
          </TabPanel>
          <TabPanel>
            {postsError ? (
              <Text textAlign="center" color="red.500">
                Failed to load posts. Please try again.
              </Text>
            ) : posts.length === 0 && !isPostsLoading ? (
              <Text textAlign="center">No posts available yet.</Text>
            ) : (
              <InfiniteScroll
                dataLength={posts.length}
                next={loadMorePosts}
                hasMore={hasMorePosts}
                loader={<Center py={4}><Spinner size="lg" /></Center>}
                endMessage={<Text textAlign="center" py={4}>No more posts to load.</Text>}
              >
                <VStack spacing={6} align="stretch">
                  {posts.map((post) => (
                    <Box
                      key={`post-${post.id}`}
                      p={8}
                      minHeight="240px"
                      borderWidth={1}
                      borderRadius="md"
                      boxShadow="sm"
                      bg={bg}
                      mb={7}
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
                            <MenuItem onClick={() => openDeleteModal(post.id, 'post')}>
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
                          <Flex gap={4} mb={5}>
                            <Flex align="center" fontSize="sm" color="teal.500">
                              <MdThumbUp size={20} />
                              <Text as="span" ml={3}>
                                {reactionCounts[post.id]?.benefited || 0}
                              </Text>
                            </Flex>
                            <Flex align="center" fontSize="sm" color="red.500">
                              <MdThumbDown size={20} />
                              <Text as="span" ml={3}>
                                {reactionCounts[post.id]?.not_benefited || 0}
                              </Text>
                            </Flex>
                          </Flex>
                          <Flex gap={2} mb={2}>
                            <Button
                              colorScheme="green"
                              size="sm"
                              flex="1"
                              isLoading={reactionMutation.isLoading}
                              opacity={userReactions[post.id] === 'benefited' ? 1 : 0.5}
                              onClick={() => handleReaction(post.id, 'benefited')}
                            >
                              <MdThumbUp size={20} />
                            </Button>
                            <Button
                              colorScheme="red"
                              size="sm"
                              variant="outline"
                              flex="1"
                              isLoading={reactionMutation.isLoading}
                              opacity={userReactions[post.id] === 'not_benefited' ? 1 : 0.5}
                              onClick={() => handleReaction(post.id, 'not_benefited')}
                            >
                              <MdThumbDown size={20} />
                            </Button>
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              </InfiniteScroll>
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
    </Container>
  );
};

export default Profile;