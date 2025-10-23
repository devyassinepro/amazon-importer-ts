import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`🗑️  Received ${topic} webhook for ${shop}`);

  // Delete all user data (GDPR compliance)
  try {
    // Delete imported products
    const deletedProducts = await prisma.importedProduct.deleteMany({
      where: { shop }
    });
    console.log(`Deleted ${deletedProducts.count} imported products for ${shop}`);

    // Delete app settings
    const deletedSettings = await prisma.appSettings.deleteMany({
      where: { shop }
    });
    console.log(`Deleted app settings for ${shop}`);

    // Delete sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { shop }
    });
    console.log(`Deleted ${deletedSessions.count} sessions for ${shop}`);

    console.log(`✅ Successfully deleted all data for ${shop}`);
  } catch (error) {
    console.error(`❌ Error deleting data for ${shop}:`, error);
  }

  return new Response();
};
