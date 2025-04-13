import { Box, Container, Heading, Text, useColorModeValue, VStack } from '@chakra-ui/react'
import React, { useState } from 'react'
import PostActions from '../components/PostActions';

function Home() {

  const [posts, setPosts] = useState([
    {id: 1, user: "ahmed", content: "beta post", date: "2025-04-14", likes: 0, hasLiked:false, comments: []},
    {id: 2, user: "mohamed", content: "that is good day", date: "2025-04-14", likes: 0,hasLiked:false, comments: []}
  ]);

  const [newComment, setNewComment] = useState({});
  const handleLike = (postId) =>{
    setPosts(posts.map(post => {
      if(post.id === postId){
        if(post.hasLiked){
          return {...post, likes:post.likes - 1, hasLiked:false}
        }else{
          return {...post, likes:post.likes + 1, hasLiked:true}
        }
      }
      return post;
    }));
  };

  const handleComment = (postId) =>{
    if(!newComment[postId]) return;
    setPosts(posts.map(post => post.id === postId ? 
      {...post, comments: [...post.comments, newComment[postId]]} : post
    ))
    setNewComment({...newComment, [postId]: ''});
  }


  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')


  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Home Page</Heading>
      <VStack spacing={4} align="stretch">
        {posts.map((post) => (
          <Box key={post.id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" bg={bg} borderColor={borderColor}>
            <Text fontWeight="bold">{post.user}</Text>
            <Text>{post.content}</Text>
            <Text fontSize="sm" color="gray.500">{post.date}</Text>
            <PostActions post={post} onLike={handleLike} onComment={handleComment}/>
          </Box>
        ))}
      </VStack>
    </Container>
  )
}

export default Home
