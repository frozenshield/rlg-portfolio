import { describe, it, expect } from 'vitest'
import { checkoutFormSchema } from './checkout-form.schema'

describe('checkout-form.schema', () => {
  it('validates a complete valid checkout payload with carrier and QR payment', async () => {
    const validData = {
      firstName: 'Emily',
      lastName: 'Watson',
      email: 'emily.watson@example.com',
      phone: '+63 917 555 0199',
      streetAddress: '742 Evergreen Terrace',
      city: 'Quezon City',
      postalCode: '1100',
      carrierId: 1,
      saveToProfile: true,
      deliveryOption: 'standard',
      paymentMethod: 'qr',
      qrMerchantCode: 'gotyme',
    }

    const parsed = await checkoutFormSchema.validate(validData)
    expect(parsed.firstName).toBe('Emily')
    expect(parsed.carrierId).toBe(1)
    expect(parsed.saveToProfile).toBe(true)
    expect(parsed.paymentMethod).toBe('qr')
  })

  it('validates paymongo_qrph payment method', async () => {
    const validData = {
      firstName: 'Emily',
      lastName: 'Watson',
      email: 'emily.watson@example.com',
      phone: '+63 917 555 0199',
      streetAddress: '742 Evergreen Terrace',
      city: 'Quezon City',
      postalCode: '1100',
      carrierId: 1,
      paymentMethod: 'paymongo_qrph',
    }

    const parsed = await checkoutFormSchema.validate(validData)
    expect(parsed.paymentMethod).toBe('paymongo_qrph')
  })

  it('rejects payload if carrierId is missing', async () => {
    const dataWithoutCarrier = {
      firstName: 'Michael',
      lastName: 'Scott',
      email: 'michael@dunder.com',
      phone: '555-123-4567',
      streetAddress: '1725 Slough Ave',
      city: 'Scranton',
      postalCode: '18503',
      paymentMethod: 'qr',
    }

    await expect(checkoutFormSchema.validate(dataWithoutCarrier)).rejects.toThrow(
      'Please select a shipping carrier',
    )
  })

  it('rejects invalid email address', async () => {
    const invalidEmailData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'not-an-email',
      phone: '1234567',
      streetAddress: '123 Toy St',
      city: 'Playtown',
      postalCode: '12345',
      carrierId: 1,
      paymentMethod: 'qr',
    }

    await expect(checkoutFormSchema.validate(invalidEmailData)).rejects.toThrow(
      'Please enter a valid email address',
    )
  })
})
