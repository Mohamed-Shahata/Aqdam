import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function FollowList() {
  const { type } = useParams(); // 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const endpoint = type === 'followers' ? api.post("/users/followers") : api.post("/users/following");
        const response = await endpoint;
        setUsers(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || `Failed to load ${type}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [type, toast, navigate]);

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
        <Text>No {type === 'followers' ? 'followers' : 'following'} yet.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {users.map((user) => (
            <Box
              key={user.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg={bg}
              borderColor={borderColor}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <Text fontWeight="bold">{user.firstName} {user.lastName}</Text>
              <Text fontSize="sm" color="gray.500">{user.bio || 'No bio'}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
}

export default FollowList;