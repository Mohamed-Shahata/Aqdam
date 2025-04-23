import {
  Box,
  Container,
  VStack,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import React, { useContext, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { AuthContext } from '../AuthContext';

const Users = () => {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch following list
  const { data: following = [], isLoading: isFollowingLoading } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await api.get('/users/following/me');
      return response.data.map((item) => String(item.id));
    },
    enabled: !!user,
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to fetch following list.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Fetch users with infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading: isUsersLoading,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['users', searchQuery, user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      const limit = 20;
      const response = await api.get(
        `/users/people?page=${pageParam}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`
      );
      const newUsers = Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      const validUsers = newUsers.filter((user) => user.id && !isNaN(user.id));
      return {
        users: validUsers,
        nextPage: validUsers.length === limit ? pageParam + 1 : undefined,
        meta: response.data.meta || {},
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to fetch users.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Flatten the users from all pages
  const users = data?.pages?.flatMap((page) => page.users) || [];

  // Mutation for toggling follow/unfollow
  const toggleFollowMutation = useMutation({
    mutationFn: async (userId) => {
      const stringUserId = String(userId);
      await api.post(`/users/follow/${stringUserId}`);
    },
    onSuccess: (_, userId) => {
      const stringUserId = String(userId);
      const isFollowing = following.includes(stringUserId);
      queryClient.setQueryData(['following', user?.id], (old) =>
        isFollowing
          ? old.filter((id) => id !== stringUserId)
          : [...old, stringUserId]
      );
      toast({
        title: 'Success',
        description: isFollowing ? 'Unfollowed successfully.' : 'Followed successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error, userId) => {
      const isFollowing = following.includes(String(userId));
      toast({
        title: 'Error',
        description: `Failed to ${isFollowing ? 'unfollow' : 'follow'} user.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleToggleFollow = (userId) => {
    toggleFollowMutation.mutate(userId);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    queryClient.invalidateQueries(['users', searchInput, user?.id]); // Invalidate to refetch with new search
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isFollowingLoading || isUsersLoading) {
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
      <InputGroup mb={6} size="lg">
        <Input
          placeholder="Search users..."
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          focusBorderColor="teal.500"
        />
        <InputRightElement>
          <IconButton
            aria-label="Search"
            icon={<SearchIcon />}
            onClick={handleSearch}
            colorScheme="teal"
            variant="ghost"
          />
        </InputRightElement>
      </InputGroup>
      {users.length > 0 ? (
        <InfiniteScroll
          dataLength={users.length}
          next={fetchNextPage}
          hasMore={hasNextPage}
          loader={
            <Flex justify="center" py={4}>
              <Spinner size="md" />
            </Flex>
          }
          endMessage={
            <Text textAlign="center" py={4}>
              No more users to show.
            </Text>
          }
        >
          <VStack spacing={4} align="stretch">
            {users.map((userItem) => (
              <Box
                key={`user-${userItem.id}`}
                p={4}
                borderWidth={1}
                borderRadius="md"
                boxShadow="sm"
                bg={bg}
                borderColor={borderColor}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Flex align="center">
                  <Link to={`/profile/${userItem.id}`}>
                    <Avatar size="md" src={userItem.profileImage} mr={3} />
                  </Link>
                  <Box>
                    <Link to={`/profile/${userItem.id}`}>
                      <Text fontWeight="bold" color="teal.500" _hover={{ textDecoration: 'underline' }}>
                        {userItem.firstName} {userItem.lastName} {userItem?.point >= 100 && (
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
                    </Link>
                    <Text fontSize="sm" color={textColor}>
                      {userItem.bio ? truncateText(userItem.bio, 50) : 'No bio available'}
                    </Text>
                  </Box>
                </Flex>
                {user && user.id !== userItem.id && (
                  <Button
                    colorScheme={following.includes(String(userItem.id)) ? 'red' : 'teal'}
                    size="sm"
                    onClick={() => handleToggleFollow(userItem.id)}
                    isLoading={toggleFollowMutation.isLoading && toggleFollowMutation.variables === userItem.id}
                  >
                    {following.includes(String(userItem.id)) ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </Box>
            ))}
          </VStack>
        </InfiniteScroll>
      ) : isFetching ? (
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Text textAlign="center" py={4}>
          No users found.
        </Text>
      )}
    </Container>
  );
};

export default Users;