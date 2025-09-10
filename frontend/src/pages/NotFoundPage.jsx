import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent
} from '@mui/material'
import { Home as HomeIcon } from '@mui/icons-material'

export default function NotFoundPage() {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', p: 6 }}>
          <Typography variant="h1" sx={{ fontSize: '6rem', mb: 2 }}>
            🎮
          </Typography>
          <Typography variant="h3" gutterBottom>
            404 - Page Not Found
          </Typography>
          <Typography color="text.secondary" paragraph>
            The page you're looking for doesn't exist. Maybe the room has ended or the link is incorrect.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{ mt: 3 }}
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}
