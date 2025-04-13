import { Box, Button, Flex, Icon, Input, Text } from '@chakra-ui/react';
import React, { useState } from 'react'
import { FaComment, FaHeart } from 'react-icons/fa';

function PostActions({post, onLike, onComment}) {
  const [comment, setComment]= useState("");
  const handleCommentSubmit = () =>{
    if(comment.trim()){
      onComment(post.id, comment);
      setComment("");
    }
  }
  return (
    <Box mt={2}>
      <Flex>
        <Button
          size="sm"
          colorScheme={post.hasLiked ? "red" : "teal"}
          variant="outline"
          onClick={()=> onLike(post.id)}
          mr={2}
          leftIcon={<Icon as={FaHeart} />}
        >({post.likes})</Button>
        <Input 
          size="sm"
          placeholder='Enter Comment'
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          mr={2}
        />
        <Button
        color="black"
          size="sm"
          colorScheme='teal'
          onClick={handleCommentSubmit}
          isDisabled= {!comment.trim()}
          leftIcon={<Icon as={FaComment} />}
        >Add</Button>
      </Flex>
      {post.comments.length > 0 && (
        <Box mt={2}>
          <Text fontWeight="bold">Comment</Text>
          {post.comments.map((comment, index) => (
            <Text key={index} fontSize="sm" color="gray.600">
              - {comment}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default PostActions
