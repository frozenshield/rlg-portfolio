import * as yup from 'yup'

export const checkoutFormSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('First name is required')
    .min(2, 'Must be at least 2 characters'),
  lastName: yup
    .string()
    .trim()
    .required('Last name is required')
    .min(2, 'Must be at least 2 characters'),
  email: yup
    .string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  phone: yup
    .string()
    .trim()
    .required('Phone number is required')
    .min(7, 'Please enter a valid phone number'),
  streetAddress: yup
    .string()
    .trim()
    .required('Delivery street address is required')
    .min(5, 'Please provide full address'),
  city: yup.string().trim().required('City is required'),
  postalCode: yup.string().trim().required('Postal code is required'),
  notes: yup.string().trim().default(''),
  carrierId: yup.number().nullable().required('Please select a shipping carrier'),
  deliveryOption: yup.string().nullable().default('standard'),
  saveToProfile: yup.boolean().default(false),
  giftMessage: yup.string().trim().default(''),
  paymentMethod: yup
    .string()
    .oneOf(['paymongo_qrph', 'paymongo_bpi', 'paymongo_ubp', 'qr', 'wallet', 'cod'])
    .required('Payment method is required')
    .default('paymongo_qrph'),
  qrMerchantCode: yup.string().trim().default('gotyme'),
  cardNumber: yup.string().optional().default(''),
  cardExpiry: yup.string().optional().default(''),
  cardCvv: yup.string().optional().default(''),
})

export type CheckoutFormValidationSchema = yup.InferType<typeof checkoutFormSchema>
