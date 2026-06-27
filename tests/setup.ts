import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@/lib/utils', () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))
