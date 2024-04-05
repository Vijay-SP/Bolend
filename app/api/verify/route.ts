import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const generatedSignature = (
 razorpayOrderId: string,
 razorpayPaymentId: string
) => {
 const keySecret = "lLHrn59lyrJtWm9Y8CHCCbPG";
 if (!keySecret) {
  throw new Error(
   'Razorpay key secret is not defined in environment variables.'
  );
 }
 const sig = crypto
  .createHmac('sha256', keySecret)
  .update(razorpayOrderId + '|' + razorpayPaymentId)
  .digest('hex');
 return sig;
};


export async function POST(request: NextRequest) {
 const { orderCreationId, razorpayPaymentId, razorpaySignature } =
  await request.json();

 const signature = generatedSignature(orderCreationId, razorpayPaymentId);
 console.log("sgnaturegen",signature)
 console.log("sgnature",razorpaySignature)
 if (signature !== razorpaySignature) {
  return NextResponse.json(
   { message: 'payment verification failed', isOk: false },
   { status: 400 }
  );
 }
 return NextResponse.json(
  { message: 'payment verified successfully', isOk: true },
  { status: 200 }
 );
}