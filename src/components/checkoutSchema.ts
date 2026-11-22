import { z } from 'zod'
import { normalizeMobile } from '../lib/phone'

/** Same rules and messages as the backend's PlaceOrderRequest, checked before sending. */
export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, { message: 'Enter the name of the person receiving the order.' })
    .max(100, { message: 'Name must be 2 to 100 characters.' }),
  mobile: z.string().refine((v) => normalizeMobile(v) !== null, { message: 'Enter a valid 10-digit mobile number.' }),
  addressLine: z
    .string()
    .trim()
    .min(8, { message: 'Enter your full address so the partner can find you.' })
    .max(500, { message: 'Keep the address under 500 characters.' }),
  landmark: z.string().trim().max(200, { message: 'Keep the landmark under 200 characters.' }),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'UPI_ON_DELIVERY']),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
