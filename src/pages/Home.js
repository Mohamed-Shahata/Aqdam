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
import React, { useContext, useEffect, useState, useRef } from 'react';
import api from '../api';
import { AuthContext } from '../AuthContext';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import io from 'socket.io-client';

// Initialize Socket.IO
const socket = io('http://localhost:3000', { withCredentials: true });

const Home = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userReactions, setUserReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const searchBg = useColorModeValue('gray.100', 'gray.700');
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Audio for notification sound
  const notificationSound = useRef(null);

  useEffect(() => {
    notificationSound.current = new Audio('/public/sounds/n.mp3');
    notificationSound.current.volume = 0.5;

    const fetchJobsAndPostsAndFavorites = async () => {
      setIsLoading(true);
      try {
        const jobsResponse = await api.get('/jobs/following');
        setJobs(jobsResponse.data);

        const postsResponse = await api.get('/posts/following');
        setPosts(postsResponse.data);

        if (user) {
          const favoritesResponse = await api.post('/jobs/favorites/me');
          setFavorites(favoritesResponse.data.map((fav) => Number(fav.id)))

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
        }
      } catch (error) {
        console.error('Fetch Error:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchJobsAndPostsAndFavorites();
    }

    return () => {
      socket.off('notification');
    };
  }, [toast, user]);


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
        await api.delete(`/jobs/favorites/${jobId}`);
        setFavorites(favorites.filter((id) => id !== jobId));
        toast({
          title: 'Success',
          description: 'Removed from favorites.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await api.post('/jobs/favorites', { jobId });
        setFavorites([...favorites, jobId]);
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


  if (isLoading) {
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
      <Box mb={6} />

      <Flex
        justify="center"
        align="center"
        w="100%"
        py={2}
      >
        <Flex
          flex={1}
          maxW="600px"
          w="100%"
          align="center"
          mb={5}
          mt={-10}
        >
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

      {jobs.length === 0 && posts.length === 0 ? (
        <Text>No jobs or posts available yet.</Text>
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
                  <Flex gap={2} mb={-2}>
                    <Button
                      colorScheme="green"
                      size="sm"
                      flex="1"
                      opacity={
                        userReactions[post.id] && userReactions[post.id] !== 'benefited' ? 0.5 : 1
                      }
                      onClick={() => handleReaction(post.id, 'benefited')}
                    >
                      <MdThumbUp size={20} />
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
                      <MdThumbDown size={20} />
                    </Button>
                  </Flex>

                </Box>
              )}
            </Box>
          ))}
        </VStack>
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