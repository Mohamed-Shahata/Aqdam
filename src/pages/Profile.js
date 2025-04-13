import { Avatar, Box, Button, Container, Divider, Flex, FormControl, FormLabel, Heading, Input, Text, useColorModeValue, VStack } from '@chakra-ui/react'
import React, { useState } from 'react'
import PostActions from '../components/PostActions'

const Profile = () => {
  const [user, setUser] = useState({
    name: "Reem Mohamed",
    email: "reemmohammed@gmail.com",
    avatar: "https://via.placeholder.com/150"
  })
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const [newAvatar, setNewAvatar] = useState(user.avatar)
  const [posts, setPosts] = useState([
    {id: 1, user: "ahmed", content: "beta post", date: "2025-04-14", likes: 0, hasLiked:false, comments: []},
  ])

  const handleAvatarChange = (e) =>{
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result);
      };
      reader.readAsDataURL(file)
    }
  };

  const handleLike = (postId) => {
    setPosts(posts.map((post) => {
      if(post.id === postId){
        if(post.hasLiked){
          return {...post, likes: post.likes - 1, hasLiked:false}
        }else{
          return {...post, likes: post.likes + 1, hasLiked:true}
        }
      }
      return post
    }))
  };

  const handleComment = (postId, comment) => {
    setPosts(posts.map((post) =>
      post.id === postId ? {...post,comments: [...post.comments, comment]} : post
    ))
  }

  const handleEdit = () =>{
    setIsEditing(true);
  };

  const handleSave = () => {
    setUser({...user, name:newName, avatar:newAvatar});
    setIsEditing(false);
  }

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>My Profile</Heading>
      <Flex align="center" mb={6}>
        <Avatar size="xl" src={user.avatar}/>
        <Box ml={4}>
          {isEditing ? (
            <VStack align="start">
              <FormControl>
                <FormLabel>Nmae</FormLabel>
                <Input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Like Your Image</FormLabel>
                <Input 
                  type="file"
                  accept='image/*'
                  onChange={handleAvatarChange}
                  p={1}
                />
                {newAvatar && (
                  <Avatar size="md" src={newAvatar} mt={2}/>
                )}
              </FormControl>
              <Button colorScheme='teal' onClick={handleSave}>Save</Button>
            </VStack>
          ):(
            <>
              <Text fontSize="2xl" fontWeight="bold">{user.name}</Text>
              <Text color="gray.500">{user.email}</Text>
              <Button mt={2} colorScheme='teal' onClick={handleEdit}>Edit file</Button>
            </>
          )}

        </Box>
      </Flex>
      <Divider />
      <Heading size="md" my={4}>My Posts</Heading>
      <VStack spacing={4} align="stretch">
        {posts.map((post) => (
          <Box key={post.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" bg={bg} borderColor={borderColor}>
            <Text>{post.content}</Text>
            <Text fontSize="sm" color="gray.500">{post.date}</Text>
            <PostActions post={post} onComment={handleComment} onLike={handleLike}/>
          </Box>
        ))}
      </VStack>
    </Container>
  )
}

export default Profile
