import type {
  ScrapedProduct,
  AppSettings,
  ProductOption,
  ProductVariant,
} from "~/types";
import { addAffiliateTag } from "./amazon-scraper.server";

interface MediaInput {
  mediaContentType: "IMAGE";
  alt: string;
  originalSource: string;
}

interface ShopifyMediaNode {
  id: string;
  alt?: string;
  mediaContentType: string;
  preview?: {
    status: string;
  };
}

interface ShopifyVariantNode {
  id: string;
  title: string;
  price: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: {
    id: string;
    url: string;
  };
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  variants: {
    edges: Array<{
      node: ShopifyVariantNode;
    }>;
  };
  media?: {
    nodes: ShopifyMediaNode[];
  };
  metafields?: {
    edges: Array<{
      node: {
        id: string;
        namespace: string;
        key: string;
        value: string;
      };
    }>;
  };
}

interface CreateProductResult {
  success: boolean;
  product?: ShopifyProduct;
  error?: string;
}

/**
 * Create a Shopify product from Amazon product data
 * @param admin - Shopify admin GraphQL client
 * @param productData - Scraped Amazon product data
 * @param amazonUrl - Original Amazon URL
 * @param settings - App settings (for affiliate tag)
 * @param shouldPublish - Whether to publish product immediately (ACTIVE) or save as DRAFT
 * @param importMode - Import mode (AFFILIATE or DROPSHIPPING)
 * @returns Result with product data or error
 */
export async function createShopifyProduct(
  admin: any,
  productData: ScrapedProduct,
  amazonUrl: string,
  settings?: AppSettings | null,
  shouldPublish: boolean = false,
  importMode: string = "DROPSHIPPING",
): Promise<CreateProductResult> {
  try {
    // ==========================================
    // STEP 1: Prepare Media Inputs
    // ==========================================
    const mediaInputs: MediaInput[] = [];
    const colorImageMap: Record<string, number> = {}; // Map color names to their media index
    const addedImageUrls = new Set<string>(); // Track added images to avoid duplicates

    console.log("=== PREPARING MEDIA INPUTS ===");

    // Priority 1: Variant-specific images from variants array
    if (productData.variants && productData.variants.length > 0) {
      productData.variants.forEach((variant) => {
        if (variant.image && !addedImageUrls.has(variant.image)) {
          addedImageUrls.add(variant.image);

          // Build descriptive alt text from variant options
          const optionLabels: string[] = [];
          const colorValue =
            variant.options.Color || variant.options.color || variant.options.Colour;
          const sizeValue = variant.options.Size || variant.options.size;
          const styleValue = variant.options.Style || variant.options.style;

          if (colorValue) optionLabels.push(colorValue);
          if (sizeValue) optionLabels.push(sizeValue);
          if (styleValue) optionLabels.push(styleValue);

          const altText =
            optionLabels.length > 0
              ? `${productData.title} - ${optionLabels.join(" - ")}`
              : `${productData.title}`;

          mediaInputs.push({
            mediaContentType: "IMAGE",
            alt: altText,
            originalSource: variant.image,
          });

          // Map color to this media index for later reference
          if (colorValue) {
            colorImageMap[colorValue] = mediaInputs.length - 1;
          }

          console.log(
            `Added variant image ${mediaInputs.length}: ${variant.image} (Color: ${colorValue})`,
          );
        }
      });
    }

    // Priority 2: General product images (max 10 images total)
    if (productData.images && productData.images.length > 0) {
      const remainingSlots = 10 - mediaInputs.length;
      const imagesToAdd = productData.images
        .filter((img) => !addedImageUrls.has(img))
        .slice(0, remainingSlots);

      imagesToAdd.forEach((imageUrl) => {
        addedImageUrls.add(imageUrl);
        mediaInputs.push({
          mediaContentType: "IMAGE",
          alt: productData.title,
          originalSource: imageUrl,
        });
        console.log(`Added general image ${mediaInputs.length}: ${imageUrl}`);
      });
    }

    console.log(
      `Total media inputs: ${mediaInputs.length}, Color map entries: ${Object.keys(colorImageMap).length}`,
    );

    // ==========================================
    // STEP 2: Create Product with Media
    // ==========================================
    console.log("=== CREATING PRODUCT ===");

    const productInput: any = {
      title: productData.title,
      descriptionHtml: formatDescription(productData),
      vendor: "Amazon Import",
      productType: "Imported",
      tags: [
        "amazon-import",
        productData.asin ? `asin:${productData.asin}` : "",
      ].filter(Boolean),
      status: shouldPublish ? "ACTIVE" : "DRAFT",
    };

    // Add product options (Color, Size, etc.) if variants exist
    // Shopify only supports up to 3 options per product
    if (productData.options && productData.options.length > 0) {
      productInput.productOptions = productData.options
        .slice(0, 3)
        .map((option) => ({
          name: option.name,
          values: option.values.map((value) => ({ name: value })),
        }));

      console.log(
        "Product options:",
        JSON.stringify(productInput.productOptions, null, 2),
      );
    }

    const productCreateResponse = await admin.graphql(
      `#graphql
      mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            title
            handle
            status
            descriptionHtml
            vendor
            productType
            tags
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
            media(first: 50) {
              nodes {
                ... on MediaImage {
                  id
                  alt
                  mediaContentType
                  preview {
                    status
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          product: productInput,
          media: mediaInputs.length > 0 ? mediaInputs : undefined,
        },
      },
    );

    const productCreateJson = await productCreateResponse.json();

    if (
      productCreateJson.data?.productCreate?.userErrors &&
      productCreateJson.data.productCreate.userErrors.length > 0
    ) {
      const errors = productCreateJson.data.productCreate.userErrors
        .map((e: any) => e.message)
        .join(", ");
      throw new Error(`Failed to create product: ${errors}`);
    }

    const product: ShopifyProduct = productCreateJson.data.productCreate.product;
    console.log("Product created:", product.id, product.title);

    // ==========================================
    // STEP 3: Build Media ID Map
    // ==========================================
    const mediaIdMap: Record<string, string> = {};
    if (product.media && product.media.nodes && product.media.nodes.length > 0) {
      // Map colors to media IDs using the index from colorImageMap
      Object.entries(colorImageMap).forEach(([colorName, mediaIndex]) => {
        if (product.media!.nodes[mediaIndex]) {
          mediaIdMap[colorName] = product.media!.nodes[mediaIndex].id;
          console.log(
            `Mapped color "${colorName}" (index ${mediaIndex}) to media ID:`,
            product.media!.nodes[mediaIndex].id,
          );
        }
      });
    }

    // ==========================================
    // STEP 4: Create Variants (if multiple)
    // ==========================================
    if (
      productData.variants &&
      productData.variants.length > 0 &&
      productData.options &&
      productData.options.length > 0
    ) {
      console.log(
        `=== CREATING ${productData.variants.length} VARIANTS ===`,
      );

      const variantsInput = productData.variants.map((variant) => {
        const optionValues: Array<{ optionName: string; name: string }> = [];

        // Build option values for this variant
        productData.options!.forEach((option) => {
          // Try both capitalized and lowercase versions
          const optionValue =
            variant.options[option.name] ||
            variant.options[option.name.toLowerCase()];

          if (optionValue) {
            optionValues.push({
              optionName: option.name,
              name: optionValue,
            });
          }
        });

        // Use variant-specific price if available, otherwise use product price
        const variantPrice =
          variant.price && variant.price > 0 ? variant.price : productData.price;

        return {
          price: variantPrice.toString(),
          inventoryPolicy: "CONTINUE",
          optionValues: optionValues,
        };
      });

      const variantsCreateResponse = await admin.graphql(
        `#graphql
        mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
          productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
            productVariants {
              id
              title
              price
              selectedOptions {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            productId: product.id,
            variants: variantsInput,
            strategy: "REMOVE_STANDALONE_VARIANT",
          },
        },
      );

      const variantsCreateJson = await variantsCreateResponse.json();

      if (
        variantsCreateJson.data?.productVariantsBulkCreate?.userErrors &&
        variantsCreateJson.data.productVariantsBulkCreate.userErrors.length > 0
      ) {
        const errors = variantsCreateJson.data.productVariantsBulkCreate.userErrors
          .map((e: any) => e.message)
          .join(", ");
        console.error("Variant creation errors:", errors);
      }

      const createdVariants: ShopifyVariantNode[] =
        variantsCreateJson.data?.productVariantsBulkCreate?.productVariants || [];
      console.log(`Created ${createdVariants.length} variants`);

      // ==========================================
      // STEP 5: Assign Images to Variants
      // ==========================================
      console.log("=== ASSIGNING IMAGES TO VARIANTS ===");

      const variantsToUpdate: Array<{ id: string; mediaId: string }> = [];

      for (let i = 0; i < createdVariants.length; i++) {
        const createdVariant = createdVariants[i];
        const originalVariant = productData.variants[i];

        let mediaId: string | null = null;
        let matchMethod = "none";

        // Method 1: Try to find image by matching with the variant's own image
        if (originalVariant?.image) {
          const imageFilename = originalVariant.image.split("/").pop();
          const matchingMedia = product.media?.nodes?.find((media) => {
            return media.alt && media.alt.includes(imageFilename!);
          });
          if (matchingMedia) {
            mediaId = matchingMedia.id;
            matchMethod = "image-filename";
          }
        }

        // Method 2: Fallback to color-based mapping
        if (!mediaId) {
          const colorOption = createdVariant.selectedOptions.find(
            (opt) => opt.name === "Color" || opt.name === "Colour",
          );
          if (colorOption && mediaIdMap[colorOption.value]) {
            mediaId = mediaIdMap[colorOption.value];
            matchMethod = "color-name";
          }
        }

        if (mediaId) {
          variantsToUpdate.push({
            id: createdVariant.id,
            mediaId: mediaId,
          });
          console.log(
            `Variant ${i + 1} (${createdVariant.title}): matched image via ${matchMethod}`,
          );
        } else {
          console.log(
            `Variant ${i + 1} (${createdVariant.title}): no image match found`,
          );
        }
      }

      // Update all variants with images in one bulk operation
      if (variantsToUpdate.length > 0) {
        console.log(
          `Updating ${variantsToUpdate.length} variants with images...`,
        );

        const bulkUpdateResponse = await admin.graphql(
          `#graphql
          mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants {
                id
                image {
                  id
                  url
                }
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              productId: product.id,
              variants: variantsToUpdate,
            },
          },
        );

        const bulkUpdateJson = await bulkUpdateResponse.json();

        if (
          bulkUpdateJson.data?.productVariantsBulkUpdate?.userErrors &&
          bulkUpdateJson.data.productVariantsBulkUpdate.userErrors.length > 0
        ) {
          console.error(
            "Image assignment errors:",
            bulkUpdateJson.data.productVariantsBulkUpdate.userErrors,
          );
        } else {
          console.log("Successfully assigned images to variants");
        }
      }
    } else {
      // ==========================================
      // STEP 5 (alt): Handle Products Without Variants
      // ==========================================
      console.log("=== NO CUSTOM VARIANTS, UPDATING DEFAULT VARIANT ===");

      const variantId = product.variants.edges[0]?.node?.id;
      if (variantId) {
        await admin.graphql(
          `#graphql
          mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants {
                id
                price
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              productId: product.id,
              variants: [
                {
                  id: variantId,
                  price: productData.price.toString(),
                  inventoryPolicy: "CONTINUE",
                },
              ],
            },
          },
        );
        console.log("Updated default variant price");
      }
    }

    // ==========================================
    // STEP 6: Add Amazon URL Metafield
    // ==========================================
    console.log("=== ADDING AMAZON URL METAFIELD ===");

    let finalAmazonUrl = amazonUrl;

    // Add affiliate tag if enabled
    if (
      settings &&
      settings.affiliateModeEnabled &&
      settings.amazonAffiliateId
    ) {
      finalAmazonUrl = addAffiliateTag(amazonUrl, settings.amazonAffiliateId);
      console.log("Added affiliate tag to URL");
    }

    await addAmazonUrlMetafield(admin, product.id, finalAmazonUrl, importMode);

    // ==========================================
    // STEP 7: Fetch Final Product Data
    // ==========================================
    const finalProductResponse = await admin.graphql(
      `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          descriptionHtml
          vendor
          productType
          tags
          variants(first: 250) {
            edges {
              node {
                id
                title
                price
                image {
                  id
                  url
                }
              }
            }
          }
          media(first: 50) {
            nodes {
              ... on MediaImage {
                id
                alt
                mediaContentType
              }
            }
          }
        }
      }`,
      {
        variables: {
          id: product.id,
        },
      },
    );

    const finalProductJson = await finalProductResponse.json();
    const finalProduct: ShopifyProduct = finalProductJson.data.product;

    console.log("=== PRODUCT CREATION COMPLETE ===");
    console.log("Product ID:", finalProduct.id);
    console.log("Product Handle:", finalProduct.handle);
    console.log("Status:", finalProduct.status);
    console.log("Variants:", finalProduct.variants.edges.length);

    return {
      success: true,
      product: finalProduct,
    };
  } catch (error) {
    console.error("Error creating Shopify product:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create Shopify product",
    };
  }
}

/**
 * Add Amazon URL and import mode as metafields to product
 */
async function addAmazonUrlMetafield(
  admin: any,
  productId: string,
  amazonUrl: string,
  importMode: string = "DROPSHIPPING",
): Promise<void> {
  try {
    await admin.graphql(
      `#graphql
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            metafields(first: 10) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            id: productId,
            metafields: [
              {
                namespace: "amazon_importer",
                key: "amazon_url",
                type: "url",
                value: amazonUrl,
              },
              {
                namespace: "amazon_importer",
                key: "import_mode",
                type: "single_line_text_field",
                value: importMode,
              },
            ],
          },
        },
      },
    );

    console.log(`Amazon metafields added successfully (mode: ${importMode})`);
  } catch (error) {
    console.error("Error adding Amazon metafields:", error);
    throw error;
  }
}

/**
 * Update product price
 */
export async function updateProductPrice(
  admin: any,
  productId: string,
  variantId: string,
  newPrice: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await admin.graphql(
      `#graphql
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          productId: productId,
          variants: [
            {
              id: variantId,
              price: newPrice.toString(),
            },
          ],
        },
      },
    );

    const responseJson = await response.json();

    if (
      responseJson.data?.productVariantsBulkUpdate?.userErrors &&
      responseJson.data.productVariantsBulkUpdate.userErrors.length > 0
    ) {
      const errors = responseJson.data.productVariantsBulkUpdate.userErrors
        .map((e: any) => e.message)
        .join(", ");
      throw new Error(`Failed to update price: ${errors}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating product price:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update price",
    };
  }
}

/**
 * Format product description HTML from Amazon data
 */
function formatDescription(productData: ScrapedProduct): string {
  let html = "";

  // Add main description
  if (productData.description) {
    html += `<p>${productData.description.replace(/\n/g, "<br/>")}</p>`;
  }

  // Add bullet points as features
  if (productData.bulletPoints && productData.bulletPoints.length > 0) {
    html += "<h3>Key Features:</h3><ul>";
    productData.bulletPoints.forEach((bullet) => {
      html += `<li>${bullet}</li>`;
    });
    html += "</ul>";
  }

  // Add specifications if available
  if (
    productData.specifications &&
    Object.keys(productData.specifications).length > 0
  ) {
    html += "<h3>Specifications:</h3><table>";
    Object.entries(productData.specifications).forEach(([key, value]) => {
      html += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`;
    });
    html += "</table>";
  }

  return html || "<p>No description available</p>";
}

/**
 * Publish a product (change status from DRAFT to ACTIVE)
 */
export async function publishProduct(
  admin: any,
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await admin.graphql(
      `#graphql
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            id: productId,
            status: "ACTIVE",
          },
        },
      },
    );

    const responseJson = await response.json();

    if (
      responseJson.data?.productUpdate?.userErrors &&
      responseJson.data.productUpdate.userErrors.length > 0
    ) {
      const errors = responseJson.data.productUpdate.userErrors
        .map((e: any) => e.message)
        .join(", ");
      throw new Error(`Failed to publish product: ${errors}`);
    }

    console.log("Product published successfully");
    return { success: true };
  } catch (error) {
    console.error("Error publishing product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to publish product",
    };
  }
}
