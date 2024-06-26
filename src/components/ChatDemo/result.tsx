import { FC, useEffect, useState, useMemo } from 'react';

import { Answer } from './answer';
import { DefaultQueries } from './DefaultQueries';
import { Sources } from './sources';
import { UploadButton } from './upload';
import { parseMarkdown } from './utils/parseMarkdown';

const SEARCH_START_TOKEN = '<search>';
const SEARCH_END_TOKEN = '</search>';

const LLM_START_TOKEN = '<completion>';
const LLM_END_TOKEN = '</completion>';

const METADATA_START_TOKEN = '<metadata>';
const METADATA_END_TOKEN = '</metadata>';

export const Result: FC<{
  query: string;
  setQuery: (query: string) => void;
  userId: string;
  apiUrl: string | undefined;
  temperature: number | null;
  topP: number | null;
  topK: number | null;
  maxTokensToSample: number | null;
  model: string;
  uploadedDocuments: string[];
  setUploadedDocuments: any;
  switches: any;
}> = ({
  query,
  setQuery,
  userId,
  apiUrl,
  temperature,
  topP,
  topK,
  maxTokensToSample,
  model,
  uploadedDocuments,
  setUploadedDocuments,
  switches,
}) => {
  const [sources, setSources] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  let timeout: NodeJS.Timeout;

  const parseStreaming = async (
    query: string,
    userId: string,
    apiUrl: string
  ) => {
    setSources(null);
    setMarkdown('');
    setIsStreaming(true);
    setError(null);
    let buffer = '';
    let inLLMResponse = false;

    try {
      const response = await fetch(`/api/rag-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userId,
          apiUrl,
          model,
          temperature,
          topP,
          topK,
          maxTokensToSample,
          hybridSearch: switches.hybrid_search?.checked,
          vectorSearch: switches.vector_search?.checked,
          useKnowledgeGraph: switches.knowledge_graph_search?.checked,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        if (buffer.includes(SEARCH_END_TOKEN)) {
          const [results, rest] = buffer.split(SEARCH_END_TOKEN);
          const cleanedResults = results.replace(SEARCH_START_TOKEN, '');
          setSources(cleanedResults);
          buffer = rest || '';
        }

        if (buffer.includes(LLM_START_TOKEN)) {
          inLLMResponse = true;
          buffer = buffer.split(LLM_START_TOKEN)[1] || '';
        }

        if (inLLMResponse) {
          const endTokenIndex = buffer.indexOf(LLM_END_TOKEN);
          if (endTokenIndex !== -1) {
            const chunk = buffer.slice(0, endTokenIndex);
            setMarkdown((prev) => prev + chunk);
            buffer = buffer.slice(endTokenIndex + LLM_END_TOKEN.length);
            inLLMResponse = false;
          } else {
            // Only append complete words
            const lastSpaceIndex = buffer.lastIndexOf(' ');
            if (lastSpaceIndex !== -1) {
              const chunk = buffer.slice(0, lastSpaceIndex);
              setMarkdown((prev) => prev + chunk + ' ');
              buffer = buffer.slice(lastSpaceIndex + 1);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error in streaming:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStreaming(false);
      if (buffer.length > 0) {
        setMarkdown((prev) => prev + buffer);
      }
    }
  };

  useEffect(() => {
    if (query === '' || !apiUrl) {
      return;
    }

    const debouncedParseStreaming = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        parseStreaming(query, userId, apiUrl);
      }, 500);
    };

    debouncedParseStreaming();

    return () => {
      clearTimeout(timeout);
    };
  }, [query, userId, apiUrl]);

  const parsedMarkdown = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div className="flex flex-col gap-8">
      {query ? (
        <>
          <Answer
            markdown={parsedMarkdown}
            sources={sources}
            isStreaming={isStreaming}
          />
          <Sources sources={sources} />
          {error && <div className="text-red-500">Error: {error}</div>}
        </>
      ) : (
        <DefaultQueries setQuery={setQuery} />
      )}

      {uploadedDocuments?.length === 0 && apiUrl && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="flex items-center p-4 bg-white shadow-2xl rounded text-blue-500 font-medium gap-4">
            Please upload at least one document to submit queries.{' '}
            <UploadButton
              userId={userId}
              apiUrl={apiUrl}
              uploadedDocuments={uploadedDocuments}
              setUploadedDocuments={setUploadedDocuments}
            />
          </div>
        </div>
      )}
    </div>
  );
};
