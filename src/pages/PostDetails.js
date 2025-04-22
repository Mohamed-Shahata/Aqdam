import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  UnorderedList,
  ListItem,
  Link,
  Button,
  Menu,
  IconButton,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { AuthContext } from '../AuthContext';
import { HamburgerIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { MdThumbDown, MdThumbUp } from 'react-icons/md';

const PostDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch post details
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const response = await api.get(`/posts/${id}`);
      return response.data;
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch post details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Fetch reaction counts for the post
  const { data: reactionCounts = { benefited: 0, not_benefited: 0 }, isLoading: isReactionCountsLoading } = useQuery({
    queryKey: ['reactionCounts', id],
    queryFn: async () => {
      const response = await api.get(`/posts/${id}/reactions`);
      return {
        benefited: response.data.benefited || 0,
        not_benefited: response.data.not_benefited || 0,
      };
    },
    enabled: !!post,
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch reaction counts.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Fetch user reactions
  const { data: userReactions = {}, isLoading: isUserReactionsLoading } = useQuery({
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch user reactions.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      queryClient.setQueryData(['reactionCounts', postId], (old) => {
        const currentCounts = old || { benefited: 0, not_benefited: 0 };
        return {
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

  // Mutation for deleting post
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']); // Invalidate posts to refresh related queries
      navigate('/profile'); // Navigate back to profile after deletion
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

  // Helper function to convert string to list items
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

  const handleReaction = (postId, type) => {
    reactionMutation.mutate({ postId, type });
  };

  if (isPostLoading || isReactionCountsLoading || isUserReactionsLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Post not found.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Box
        key={`post-${post.id}`}
        p={8}
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
              <MenuItem onClick={() => deletePostMutation.mutate()}>
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
              {post.content}
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
                  {reactionCounts.benefited}
                </Text>
              </Flex>
              <Flex align="center" fontSize="sm" color="red.500">
                <MdThumbDown size={20} />
                <Text as="span" ml={3}>
                  {reactionCounts.not_benefited}
                </Text>
              </Flex>
            </Flex>

            <Flex gap={2} mb={2}>
              <Button
                colorScheme="green"
                size="sm"
                flex="1"
                opacity={userReactions[post.id] && userReactions[post.id] !== 'benefited' ? 0.5 : 1}
                onClick={() => handleReaction(post.id, 'benefited')}
                isLoading={reactionMutation.isLoading && reactionMutation.variables?.postId === post.id}
              >
                <MdThumbUp size={20} />
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                variant="outline"
                flex="1"
                opacity={userReactions[post.id] && userReactions[post.id] !== 'not_benefited' ? 0.5 : 1}
                onClick={() => handleReaction(post.id, 'not_benefited')}
                isLoading={reactionMutation.isLoading && reactionMutation.variables?.postId === post.id}
              >
                <MdThumbDown size={20} />
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PostDetails;