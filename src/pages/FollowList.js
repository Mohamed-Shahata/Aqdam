import React from 'react';
import {
  Box,
  Heading,
  VStack,
  Container,
  useColorModeValue,
  useToast,
  Text,
  Spinner,
  Center,
  Flex,
  Avatar,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Link as RouterLink } from 'react-router-dom';
import maleProfile from "../pages/gender/male.jpg";
import femaleProfile from "../pages/gender/female.jpg";

function FollowList() {
  const { type, id } = useParams(); // 'followers' or 'following'
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const navigate = useNavigate();

  // Fetch followers or following
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['followList', type, id],
    queryFn: async () => {
      const endpoint =
        type === 'followers'
          ? api.post(`/users/${id}/followers`)
          : api.post(`/users/${id}/following`);
      const response = await endpoint;
      return Array.isArray(response.data) ? response.data : [];
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `Failed to load ${type}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/profile');
    },
  });

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>{type === 'followers' ? 'Followers' : 'Following'}</Heading>
      {users.length === 0 ? (
        <Text>No users found.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {users.map((user) => (
            <Box
              key={user.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              boxShadow="sm"
              bg={bg}
              borderColor={borderColor}
              as={RouterLink}
              to={`/profile/${user.id}`}
            >
              <Flex align="center">
                <Avatar size="md" src={
                  user?.profileImage
                    ? user.profileImage
                    : user?.gender === 'male'
                      ? maleProfile
                      : femaleProfile} mr={4} />
                <Box>
                  <Text fontWeight="bold">
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {user.bio || 'No bio available'}
                  </Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
}

export default FollowList;