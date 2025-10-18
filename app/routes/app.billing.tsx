import { Page, Card, Text, BlockStack } from "@shopify/polaris";
import Layout from "../components/Layout";

export default function Billing() {
  return (
    <Layout>
      <Page title="Billing">
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Current Plan
              </Text>
              <Text as="p" variant="bodyMd">
                Free Plan - No charges
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Usage
              </Text>
              <Text as="p" variant="bodyMd">
                No usage data available yet.
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Billing History
              </Text>
              <Text as="p" variant="bodyMd">
                No billing history available.
              </Text>
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>
    </Layout>
  );
}
