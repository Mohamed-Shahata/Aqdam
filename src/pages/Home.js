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
  InputGroup,
  Input,
  InputRightElement,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { HamburgerIcon, SearchIcon } from '@chakra-ui/icons';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { MdThumbDown, MdThumbUp } from 'react-icons/md';
import React, { useContext, useState } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../api';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';
import { format } from 'date-fns';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const searchBg = useColorModeValue('gray.100', 'gray.700');
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch feeds with infinite query for pagination
  const fetchFeeds = async ({ pageParam = 1 }) => {
    const limit = 10;
    const response = await api.get(`/posts/feeds?page=${pageParam}&limit=${limit}`);
    return {
      data: Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [],
      nextPage: response.data.data?.length === limit ? pageParam + 1 : undefined,
    };
  };

  const {
    data: feedsData,
    fetchNextPage,
    hasNextPage,
    isLoading: isFeedsLoading,
    error: feedsError,
  } = useInfiniteQuery({
    queryKey: ['feeds'],
    queryFn: fetchFeeds,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
  });

  // Fetch favorites
  const { data: favorites = [], isLoading: isFavoritesLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const response = await api.post('/jobs/favorites/me');
      return response.data.map((fav) => Number(fav.id));
    },
    enabled: !!user,
  });

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
    enabled: !!user,
  });

  // Fetch reaction counts for posts
  const { data: reactionCounts = {}, isLoading: isReactionCountsLoading } = useQuery({
    queryKey: ['reactionCounts', feedsData?.pages?.flatMap((page) => page.data)?.filter((item) => item.type === 'post')?.map((post) => post.id)],
    queryFn: async () => {
      const posts = feedsData?.pages?.flatMap((page) => page.data)?.filter((item) => item.type === 'post') || [];
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
            console.error(`Failed to fetch reactions for post ${post.id}:`, error);
            reactionCountsData[post.id] = { benefited: 0, not_benefited: 0 };
          }
        })
      );
      return reactionCountsData;
    },
    enabled: !!feedsData && !!user,
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
    onSuccess: (_, { postId, type }) => {
      const currentReaction = userReactions[postId];
      queryClient.setQueryData(['userReactions', user?.id], (old) => {
        const newReactions = { ...old };
        if (currentReaction === type) {
          delete newReactions[postId];
        } else {
          newReactions[postId] = type;
        }
        return newReactions;
      });
      queryClient.setQueryData(['reactionCounts'], (old) => {
        const currentCounts = old?.[postId] || { benefited: 0, not_benefited: 0 };
        return {
          ...old,
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
        description: currentReaction === type ? 'Reaction removed.' : `Marked as ${type === 'benefited' ? 'Benefited' : 'Not Benefited'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to manage reaction.',
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
        await api.delete(`/jobs/favorites/${jobId}`);
      } else {
        await api.post('/jobs/favorites', { jobId });
      }
    },
    onSuccess: (_, jobId) => {
      queryClient.setQueryData(['favorites', user?.id], (old) =>
        favorites.includes(jobId) ? old.filter((id) => id !== jobId) : [...old, jobId]
      );
      toast({
        title: 'Success',
        description: favorites.includes(jobId) ? 'Removed from favorites.' : 'Added to favorites.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for deleting a job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId) => {
      await api.delete(`/jobs/${jobId}`);
    },
    onSuccess: (_, jobId) => {
      queryClient.setQueryData(['feeds'], (old) => ({
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => !(item.type === 'job' && item.id === jobId)),
        })),
      }));
      toast({
        title: 'Success',
        description: 'Job deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete job.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for deleting a post
  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      await api.delete(`/posts/${postId}`);
    },
    onSuccess: (_, postId) => {
      queryClient.setQueryData(['feeds'], (old) => ({
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => !(item.type === 'post' && item.id === postId)),
        })),
      }));
      toast({
        title: 'Success',
        description: 'Post deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete post.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleReaction = (postId, type) => {
    reactionMutation.mutate({ postId, type });
  };

  const handleFavorite = (jobId) => {
    favoriteMutation.mutate(jobId);
  };

  const openDeleteModal = (jobId) => {
    setJobIdToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setJobIdToDelete(null);
  };

  const confirmDeleteJob = () => {
    if (jobIdToDelete) {
      deleteJobMutation.mutate(jobIdToDelete);
    }
    closeDeleteModal();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const stringToList = (str) => {
    if (!str) return [];
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
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

  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleToggleContent = (postId) => {
    setExpandedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  if (isFeedsLoading || isFavoritesLoading || isReactionsLoading || isReactionCountsLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (feedsError) {
    toast({
      title: 'Error',
      description: feedsError.response?.data?.message || 'Failed to fetch feeds.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }

  const feeds = feedsData?.pages?.flatMap((page) => page.data) || [];

  return (
    <Container maxW="container.md" py={8}>
      <Box mb={6} />
      <Flex justify="center" align="center" w="100%" py={2}>
        <Flex flex={1} maxW="600px" w="100%" align="center" mb={5} mt={-10}>
          <InputGroup w="100%">
            <Input
              placeholder="Search for people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              borderRadius="md"
              size="md"
              bg={searchBg}
              _focus={{ borderColor: 'teal.500' }}
            />
            <InputRightElement>
              <IconButton
                aria-label="Search"
                icon={<SearchIcon />}
                onClick={handleSearch}
                variant="ghost"
                size="sm"
                colorScheme="teal"
              />
            </InputRightElement>
          </InputGroup>
        </Flex>
      </Flex>
      {Array.isArray(feeds) && feeds.length > 0 ? (
        <InfiniteScroll
          dataLength={feeds.length}
          next={fetchNextPage}
          hasMore={hasNextPage}
          loader={
            <Flex justify="center" py={4}>
              <Spinner size="md" />
            </Flex>
          }
          endMessage={
            <Text textAlign="center" py={4}>
              No more feeds to show.
            </Text>
          }
        >
          <VStack spacing={6} align="stretch">
            {feeds.map((item) =>
              item.type === 'job' ? (
                <Box
                  key={`job-${item.id}`}
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
                          {Number(item.user?.id) === Number(user.id) ? (
                            <>
                              <MenuItem as={RouterLink} to={`/edit-job/${item.id}`}>
                                Edit
                              </MenuItem>
                              <MenuItem onClick={() => openDeleteModal(item.id)}>
                                Delete
                              </MenuItem>
                            </>
                          ) : (
                            <MenuItem onClick={() => handleFavorite(item.id)}>
                              {favorites.includes(item.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                      <IconButton
                        icon={favorites.includes(item.id) ? <FaHeart /> : <FaRegHeart />}
                        variant="ghost"
                        size="sm"
                        position="absolute"
                        top={4}
                        right={12}
                        aria-label={favorites.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                        color={favorites.includes(item.id) ? 'teal.500' : 'gray.500'}
                        _hover={{ color: 'teal.600' }}
                        onClick={() => handleFavorite(item.id)}
                      />
                    </>
                  )}
                  <Flex align="center" mb={6}>
                    <Avatar size="md" src={item.user?.profileImage} mr={3} />
                    <Box>
                      <Link
                        as={RouterLink}
                        to={`/profile/${item.user?.id}`}
                        fontWeight="bold"
                        color="teal.500"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        {item.user?.firstName} {item.user?.lastName}
                      </Link>
                      <Text fontSize="sm" color="gray.500">
                        {format(new Date(item.createdAt), 'hh:mm a')} -{' '}
                        {dayjs(item.createdAt).format('YYYY-MM-DD')}
                      </Text>
                    </Box>
                  </Flex>
                  <Heading
                    size="md"
                    mb={4}
                    as={RouterLink}
                    to={`/jobs/${item.id}`}
                    color="teal.500"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {item.title}
                  </Heading>
                  {item.short_intro && (
                    <Text color={textColor} mb={4}>
                      {truncateText(item.short_intro, 100)}
                    </Text>
                  )}
                  {item.responsibilities && (
                    <>
                      <Text fontWeight="semibold" mb={2}>
                        Responsibilities:
                      </Text>
                      <UnorderedList mb={4} color={textColor}>
                        {stringToList(item.responsibilities)
                          .slice(0, 2)
                          .map((resp, index) => (
                            <ListItem key={index}>{resp}</ListItem>
                          ))}
                        {stringToList(item.responsibilities).length > 2 && (
                          <Text as="span" color={textColor} fontSize="sm">
                            ...
                          </Text>
                        )}
                      </UnorderedList>
                    </>
                  )}
                  {item.email_applay && (
                    <Flex justifyContent="center">
                      <Button
                        as="a"
                        href={`mailto:${item.email_applay}?subject=Job Application - ${encodeURIComponent(
                          item.title
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
              ) : (
                <Box
                  key={`post-${item.id}`}
                  p={8}
                  minHeight="240px"
                  borderWidth={1}
                  borderRadius="md"
                  boxShadow="sm"
                  bg={bg}
                  borderColor={borderColor}
                  position="relative"
                >
                  {user && Number(item.user?.id) === Number(user.id) && (
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
                        <MenuItem as={RouterLink} to={`/edit-post/${item.id}`}>
                          Edit
                        </MenuItem>
                        <MenuItem onClick={() => deletePostMutation.mutate(item.id)}>
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                  <Flex align="center" mb={6}>
                    <Avatar size="md" src={item.user?.profileImage} mr={3} />
                    <Box>
                      <Link
                        as={RouterLink}
                        to={`/profile/${item.user?.id}`}
                        fontWeight="bold"
                        color="teal.500"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        {item.user?.firstName} {item.user?.lastName}
                      </Link>
                      <Text fontSize="sm" color="gray.500">
                        {format(new Date(item.createdAt), 'hh:mm a')} -{' '}
                        {dayjs(item.createdAt).format('YYYY-MM-DD')}
                      </Text>
                    </Box>
                  </Flex>
                  <Heading
                    size="lg"
                    mb={4}
                    as={RouterLink}
                    to={`/posts/${item.id}`}
                    color="teal.500"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {item.title}
                  </Heading>
                  {item.content && (
                    <Box mb={6}>
                      <Text fontWeight="semibold" mb={2}>
                        Content
                      </Text>
                      <Text color={textColor} whiteSpace="pre-wrap">
                        {expandedPosts.includes(item.id)
                          ? item.content
                          : truncateText(item.content, 200)}
                        {item.content.length > 200 && (
                          <Link
                            color="teal.500"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => handleToggleContent(item.id)}
                            ml={2}
                          >
                            {expandedPosts.includes(item.id) ? 'Show Less' : 'More'}
                          </Link>
                        )}
                      </Text>
                    </Box>
                  )}
                  {item.resources && (
                    <Box mb={6}>
                      <Text fontWeight="semibold" mb={2}>
                        Resources
                      </Text>
                      <UnorderedList color={textColor} spacing={2}>
                        {renderResources(item.resources)}
                      </UnorderedList>
                    </Box>
                  )}
                  {user && (
                    <Box>
                      <Flex gap={4} mb={5}>
                        <Flex align="center" fontSize="sm" color="teal.500">
                          <MdThumbUp size={20} />
                          <Text as="span" ml={3}>
                            {reactionCounts[item.id]?.benefited || 0}
                          </Text>
                        </Flex>
                        <Flex align="center" fontSize="sm" color="red.500">
                          <MdThumbDown size={20} />
                          <Text as="span" ml={3}>
                            {reactionCounts[item.id]?.not_benefited || 0}
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex gap={2} mb={-2}>
                        <Button
                          colorScheme="green"
                          size="sm"
                          flex="1"
                          opacity={
                            userReactions[item.id] && userReactions[item.id] !== 'benefited' ? 0.5 : 1
                          }
                          onClick={() => handleReaction(item.id, 'benefited')}
                        >
                          <MdThumbUp size={20} />
                        </Button>
                        <Button
                          colorScheme="red"
                          size="sm"
                          variant="outline"
                          flex="1"
                          opacity={
                            userReactions[item.id] && userReactions[item.id] !== 'not_benefited' ? 0.5 : 1
                          }
                          onClick={() => handleReaction(item.id, 'not_benefited')}
                        >
                          <MdThumbDown size={20} />
                        </Button>
                      </Flex>
                    </Box>
                  )}
                </Box>
              )
            )}
          </VStack>
        </InfiniteScroll>
      ) : (
        <Text>No jobs or posts available yet.</Text>
      )}
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