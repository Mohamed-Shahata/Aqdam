import { Box, Button, FormControl, FormLabel, Heading, Input, Text, Link, useColorModeValue, useToast } from '@chakra-ui/react'
import axios from 'axios';
import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from "react-router-dom"
import Cookies from "js-cookie"

function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState(12);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast()
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_DOMAIN}/api/auth/register`, {
        firstName, lastName, age, email, password
      });

      if (response.status === 200) {
        Cookies.set("registerEmail", email, { expires: 1 })
        toast({
          title: "Account created successfully 🎉",
          description: "Please check your email inbox to verify your account.",
          status: "success",
          duration: 5000,
          isClosable: true
        });
        navigate("/verify-code")
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
    setIsLoading(false);
  }
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
      <Heading mb={6} textAlign="center">Register</Heading>

      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>First Name</FormLabel>
          <Input
            type='text'
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder='Enter your first name please'
            required
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Last Name</FormLabel>
          <Input
            type='text'
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder='Enter your last name please'
            required
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Age</FormLabel>
          <Input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder='Enter your age please'
            required
          />
        </FormControl>
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
        <Button colorScheme='teal' width="full" type="submit" isLoading={isLoading}> Create Account</Button>
      </form>
      <Text mt={4} textAlign="center">
        Already have account
        <Link as={RouterLink} to="/login" color="teal.500"> Login</Link>
      </Text>
    </Box>
  )
}

export default Register
