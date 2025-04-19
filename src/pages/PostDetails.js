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
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';
import { HamburgerIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';
import { format } from 'date-fns';

const PostDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userReactions, setUserReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({ benefited: 0, not_benefited: 0 });
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const postResponse = await api.get(`/posts/${id}`);
        setPost(postResponse.data);

        const reactionResponse = await api.get(`/posts/${id}/reactions`);
        setReactionCounts({
          benefited: reactionResponse.data.benefited || 0,
          not_benefited: reactionResponse.data.not_benefited || 0,
        });

        if (user) {
          const reactionsResponse = await api.get('/posts/reactions/me');
          const userReactionsData = Array.isArray(reactionsResponse.data)
            ? reactionsResponse.data.reduce((acc, reaction) => {
              acc[reaction.postId] = reaction.type;
              return acc;
            }, {})
            : {};
          setUserReactions(userReactionsData);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch post details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [id, toast, user]);

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
          [type]: prev[type] - 1,
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
        setReactionCounts((prev) => ({
          benefited:
            type === 'benefited'
              ? prev.benefited + 1
              : currentReaction === 'benefited'
                ? prev.benefited - 1
                : prev.benefited,
          not_benefited:
            type === 'not_benefited'
              ? prev.not_benefited + 1
              : currentReaction === 'not_benefited'
                ? prev.not_benefited - 1
                : prev.not_benefited,
        }));
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

  if (isLoading) {
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
              <MenuItem
                onClick={async () => {
                  try {
                    await api.delete(`/posts/${post.id}`);
                    setPost(null);
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
            <Flex gap={2} mb={2}>
              <Button
                colorScheme="green"
                size="sm"
                flex="1"
                opacity={userReactions[post.id] && userReactions[post.id] !== 'benefited' ? 0.5 : 1}
                onClick={() => handleReaction(post.id, 'benefited')}
              >
                Benefited {reactionCounts.benefited > 0 ? `(${reactionCounts.benefited})` : ''}
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
                Not Benefited {reactionCounts.not_benefited > 0 ? `(${reactionCounts.not_benefited})` : ''}
              </Button>
            </Flex>
            <Flex gap={4}>
              <Text fontSize="sm" color="teal.500">
                Benefited: {reactionCounts.benefited}
              </Text>
              <Text fontSize="sm" color="red.500">
                Not Benefited: {reactionCounts.not_benefited}
              </Text>
            </Flex>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PostDetails;