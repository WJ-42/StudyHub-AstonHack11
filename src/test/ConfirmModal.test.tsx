import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

afterEach(() => {
  cleanup()
})

const defaultProps = {
  open: true,
  title: 'Confirm action',
  message: 'Are you sure?',
  confirmLabel: 'Confirm',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmModal', () => {
  it('renders nothing when open is false', () => {
    render(<ConfirmModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Confirm action')).not.toBeInTheDocument()
  })

  it('renders the title and message when open', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Confirm action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
    await userEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('renders custom labels', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Delete" cancelLabel="Keep" />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })
})