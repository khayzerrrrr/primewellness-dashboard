import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '../../components/ui/button'

test('renders Button with children text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})
