import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { Box, Button, FormControl, FormLabel, Heading, Input, Text, Link, useColorModeValue, useToast } from '@chakra-ui/react'
import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from "react-router-dom"
import axios from "axios"


function Login() {

  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast()
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_DOMAIN}/api/auth/login`, {
        email, password
      });

      if (response.status === 200) {
        const token = response.data.accessToken
        login(token);
        toast({
          title: "Login successful 🎉",
          description: "Welcome back! You have successfully logged in.",
          status: "success",
          duration: 5000,
          isClosable: true
        });
        navigate('/home')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong"
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
    setIsLoading(false);
  };

  return (
    <Box
      maxW="400px"
      mx="auto"
      mt="100px"
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg={bg}
      borderColor={borderColor}
    >
      <Heading mb={6} textAlign="center">Login</Heading>

      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>Email</FormLabel>
          <Input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Enter your email please'
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Password</FormLabel>
          <Input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Enter your password please'
            required
          />
        </FormControl>
        <Button colorScheme='teal' width="full" type="submit" isLoading={isLoading}>Login</Button>
      </form>
      <Text mt={4} textAlign="center">
        I don't have account
        <Link as={RouterLink} to="/register" color="teal.500"> Create new account</Link>
      </Text>
    </Box>
  )
}

export default Login
