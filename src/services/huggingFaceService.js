/**
 * Service for interacting with Hugging Face models
 */
import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face inference client
// In a real app, you would use an API key from environment variables
let hf = null;

export const initializeHuggingFace = (apiKey) => {
  hf = new HfInference(apiKey);
  return hf;
};

export const initializeHuggingFaceClient = () => {
  if (!hf) {
    // Use a default key or throw an error
    console.warn('HuggingFace client not initialized with API key, using anonymous access');
    hf = new HfInference();
  }
  return hf;
};

export const getHuggingFaceClient = () => {
  if (!hf) {
    // Use a default key or throw an error
    console.warn('HuggingFace client not initialized with API key, using anonymous access');
    hf = new HfInference();
  }
  return hf;
};

export const runTextCleaning = async (text, model = 'gpt2') => {
  try {
    const client = getHuggingFaceClient();
    
    // For a real implementation, you would use a more appropriate model
    // This is a simplified example
    const result = await client.textGeneration({
      model,
      inputs: `Clean the following text: ${text}`,
      parameters: {
        max_new_tokens: 250,
        return_full_text: false
      }
    });
    
    return result.generated_text;
  } catch (error) {
    console.error('Error cleaning text with Hugging Face:', error);
    
    // Fallback to basic cleaning if the API fails
    return text
      .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
      .replace(/[^\w\s.,?!;:()]/g, '') // Remove special characters
      .trim();                       // Trim whitespace
  }
};

export const runTextClassification = async (text, model = 'distilbert-base-uncased-finetuned-sst-2-english') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.textClassification({
      model,
      inputs: text
    });
    
    return result;
  } catch (error) {
    console.error('Error classifying text with Hugging Face:', error);
    throw error;
  }
};

export const runImageClassification = async (imageFile, model = 'google/vit-base-patch16-224') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.imageClassification({
      model,
      data: imageFile
    });
    
    return result;
  } catch (error) {
    console.error('Error classifying image with Hugging Face:', error);
    throw error;
  }
};

export const runTokenClassification = async (text, model = 'dbmdz/bert-large-cased-finetuned-conll03-english') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.tokenClassification({
      model,
      inputs: text
    });
    
    return result;
  } catch (error) {
    console.error('Error performing token classification with Hugging Face:', error);
    throw error;
  }
};

export const runQuestionAnswering = async (question, context, model = 'distilbert-base-cased-distilled-squad') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.questionAnswering({
      model,
      inputs: {
        question,
        context
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error performing question answering with Hugging Face:', error);
    throw error;
  }
};

export const runSummarization = async (text, model = 'facebook/bart-large-cnn') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.summarization({
      model,
      inputs: text,
      parameters: {
        max_length: 100,
        min_length: 30
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error summarizing text with Hugging Face:', error);
    throw error;
  }
};

export const runTranslation = async (text, model = 'Helsinki-NLP/opus-mt-en-fr') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.translation({
      model,
      inputs: text
    });
    
    return result;
  } catch (error) {
    console.error('Error translating text with Hugging Face:', error);
    throw error;
  }
};

export const runFillMask = async (text, model = 'bert-base-uncased') => {
  try {
    const client = getHuggingFaceClient();
    
    const result = await client.fillMask({
      model,
      inputs: text
    });
    
    return result;
  } catch (error) {
    console.error('Error filling mask with Hugging Face:', error);
    throw error;
  }
};