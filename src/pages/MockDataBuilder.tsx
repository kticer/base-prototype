/**
 * getRandomPastDate
 * Returns a random date string in the format "YYYY Month DD" from the last 10 years.
 */
function getRandomPastDate(): string {
  const now = new Date();
  // 10 years in ms
  const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000;
  // Pick a random time between now and 10 years ago
  const randomTime = now.getTime() - Math.floor(Math.random() * tenYearsMs);
  const randomDate = new Date(randomTime);
  // Format: "YYYY Month DD"
  const year = randomDate.getFullYear();
  const month = randomDate.toLocaleString("default", { month: "long" });
  const day = String(randomDate.getDate()).padStart(2, "0");
  return `${year} ${month} ${day}`;
}
// MockDataBuilder.tsx
// This file provides a React page/component for generating mock document data (including pages, highlights, and match cards)
// for use in testing or prototyping applications like iThenticate or Turnitin. It includes UI for user input,
// logic for generating realistic document structures, and utilities for text processing.

import React, { useState } from "react";
import JSZip from "jszip";
import { Helmet } from "react-helmet";
import * as pdfjsLib from "pdfjs-dist";
import { validateNumericInput } from "../utils/validation";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

/**
 * Highlight Generation Rules:
 *
 * - Each matchCard must include:
 *   - 2 multi-sentence matches:
 *     - Each is between 3 and 6 full sentences
 *     - Each contains at least 7 words
 *   - Additional matches (if needed to reach min/max range):
 *     - 1 to 3 sentences
 *     - Must also contain at least 7 words
 *
 * - Matches are pulled from across the document text.
 * - Pages are synthesized based on either the full text or real PDF content.
 */

/**
 * slugify
 * Converts a string to a URL-safe slug by lowercasing and replacing non-alphanumeric characters with hyphens.
 */
const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * getTopicFromTitle
 * Attempts to infer a document topic area from its title string.
 * Returns a topic key matching one of the categories in sourcePools.
 */
function getTopicFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("business") || t.includes("growth") || t.includes("startup")) return "business";
  if (t.includes("ocean") || t.includes("whale") || t.includes("animal")) return "nature";
  if (t.includes("climate") || t.includes("research") || t.includes("education")) return "academic";
  if (t.includes("movie") || t.includes("film") || t.includes("oscar")) return "entertainment";
  if (t.includes("sport") || t.includes("athlete") || t.includes("game")) return "sports";
  if (t.includes("food") || t.includes("recipe") || t.includes("cooking")) return "food";
  if (t.includes("tech") || t.includes("software") || t.includes("computer")) return "technology";
  return "general";
}

/**
 * sourcePools
 * Maps topic categories to arrays of plausible publication/source objects with name and type.
 */
const sourcePools: Record<string, { name: string, type: string }[]> = {
  business: [
    { name: "Harvard Business Review", type: "Publication" },
    { name: "Entrepreneur.com", type: "Internet" },
    { name: "McKinsey Insights", type: "Publication" },
    { name: "The Hustle Blog", type: "Internet" },
    { name: "SmallBizTrends.net", type: "Internet" },
    { name: "Forbes – Business", type: "Publication" },
    { name: "Inc.com", type: "Internet" },
    { name: "Wall Street Journal", type: "Publication" },
    { name: "Fast Company", type: "Publication" },
    { name: "Bloomberg Business", type: "Publication" },
    { name: "The Economist", type: "Publication" },
    { name: "Bain Insights", type: "Publication" },
    { name: "Startup Grind", type: "Internet" },
    { name: "Harvard Case Studies", type: "Publication" },
    { name: "Pitchbook", type: "Publication" },
    { name: "Crunchbase News", type: "Internet" },
    { name: "AngelList Blog", type: "Internet" },
    { name: "BusinessInsider", type: "Internet" },
    { name: "Y Combinator Blog", type: "Internet" },
    { name: "Morning Brew", type: "Internet" }
  ],
  nature: [
    { name: "National Geographic", type: "Publication" },
    { name: "Nature – Biology", type: "Publication" },
    { name: "OceanicResearch.org", type: "Internet" },
    { name: "WhaleTrust.org", type: "Internet" },
    { name: "DeepSeaBlog.net", type: "Internet" },
    { name: "ScienceNews.org", type: "Internet" },
    { name: "LiveScience", type: "Internet" },
    { name: "The Ecologist", type: "Publication" },
    { name: "Smithsonian Magazine", type: "Publication" },
    { name: "BBC Earth", type: "Publication" },
    { name: "TreeHugger", type: "Internet" },
    { name: "Earth.com", type: "Internet" },
    { name: "EcoWatch", type: "Internet" },
    { name: "MarineBio.org", type: "Internet" },
    { name: "Wildlife Society", type: "Publication" },
    { name: "WWF Reports", type: "Publication" },
    { name: "NOAA.gov", type: "Internet" },
    { name: "Planet Earth Blog", type: "Internet" },
    { name: "BioInteractive", type: "Internet" },
    { name: "Earthwatch Institute", type: "Publication" }
  ],
  academic: [
    { name: "JSTOR", type: "Publication" },
    { name: "ResearchGate", type: "Internet" },
    { name: "Wikipedia – Sociology", type: "Internet" },
    { name: "Journal of Climate Science", type: "Publication" },
    { name: "EduBlog.org", type: "Internet" },
    { name: "Google Scholar", type: "Internet" },
    { name: "Springer Link", type: "Publication" },
    { name: "Cambridge Journals", type: "Publication" },
    { name: "Oxford Academic", type: "Publication" },
    { name: "ERIC.gov", type: "Internet" },
    { name: "ScienceDirect", type: "Publication" },
    { name: "Taylor & Francis Online", type: "Publication" },
    { name: "PubMed", type: "Publication" },
    { name: "Open Library", type: "Submitted Works" },
    { name: "SAGE Journals", type: "Publication" },
    { name: "Academic Earth", type: "Submitted Works" },
    { name: "Coursera Blog", type: "Submitted Works" },
    { name: "edX Resources", type: "Submitted Works" },
    { name: "Khan Academy Articles", type: "Submitted Works" },
    { name: "Scholarly Commons", type: "Submitted Works" }
  ],
  entertainment: [
    { name: "Variety", type: "Publication" },
    { name: "IndieWire", type: "Internet" },
    { name: "IMDB – User Reviews", type: "Internet" },
    { name: "Collider", type: "Internet" },
    { name: "FilmTheoryFan.blog", type: "Internet" },
    { name: "The Hollywood Reporter", type: "Publication" },
    { name: "Rotten Tomatoes", type: "Internet" },
    { name: "Metacritic", type: "Internet" },
    { name: "Screen Rant", type: "Internet" },
    { name: "CinemaBlend", type: "Internet" },
    { name: "The Wrap", type: "Internet" },
    { name: "TV Tropes", type: "Internet" },
    { name: "Buzzfeed – Entertainment", type: "Internet" },
    { name: "Entertainment Weekly", type: "Publication" },
    { name: "Vulture", type: "Internet" },
    { name: "PopSugar Entertainment", type: "Internet" },
    { name: "Decider", type: "Internet" },
    { name: "Empire Online", type: "Internet" },
    { name: "Fandom.com", type: "Internet" },
    { name: "Deadline", type: "Publication" }
  ],
  general: [
    { name: "Wikipedia – General Knowledge", type: "Internet" },
    { name: "Stack Overflow", type: "Internet" },
    { name: "Reddit – AskScience", type: "Internet" },
    { name: "Medium – Tech Musings", type: "Internet" },
    { name: "The Curious Academic", type: "Publication" },
    { name: "Quora", type: "Internet" },
    { name: "eHow", type: "Internet" },
    { name: "HowStuffWorks", type: "Internet" },
    { name: "About.com", type: "Internet" },
    { name: "WiseGeek", type: "Internet" },
    { name: "Scribd", type: "Internet" },
    { name: "Blogger.com", type: "Internet" },
    { name: "Wikibooks", type: "Internet" },
    { name: "Wikiquote", type: "Internet" },
    { name: "Infoplease", type: "Internet" },
    { name: "Lifehacker", type: "Internet" },
    { name: "The Independent", type: "Publication" },
    { name: "The Atlantic", type: "Publication" },
    { name: "NYTimes – Opinion", type: "Publication" },
    { name: "Vox Explainers", type: "Internet" }
  ],
  sports: [
    { name: "ESPN.com", type: "Internet" },
    { name: "Bleacher Report", type: "Internet" },
    { name: "Sports Illustrated", type: "Publication" },
    { name: "Fox Sports", type: "Internet" },
    { name: "CBS Sports", type: "Internet" },
    { name: "The Ringer – Sports", type: "Internet" },
    { name: "SB Nation", type: "Internet" },
    { name: "Athletic Insight", type: "Publication" },
    { name: "Goal.com", type: "Internet" },
    { name: "NBA.com", type: "Internet" },
    { name: "MLB Network", type: "Publication" },
    { name: "FIFA.com", type: "Internet" },
    { name: "NHL.com", type: "Internet" },
    { name: "Tennis World", type: "Publication" },
    { name: "Olympics Blog", type: "Internet" },
    { name: "RunningWeekly.org", type: "Internet" },
    { name: "Coach's Corner", type: "Publication" },
    { name: "DraftKings Sportsbook", type: "Internet" },
    { name: "FanSided", type: "Internet" },
    { name: "Ultimate Frisbee Today", type: "Internet" }
  ],
  food: [
    { name: "Bon Appétit", type: "Publication" },
    { name: "Serious Eats", type: "Internet" },
    { name: "Food Network", type: "Internet" },
    { name: "Epicurious", type: "Internet" },
    { name: "New York Times Cooking", type: "Publication" },
    { name: "The Kitchn", type: "Internet" },
    { name: "AllRecipes.com", type: "Internet" },
    { name: "America's Test Kitchen", type: "Publication" },
    { name: "Gourmet Traveller", type: "Publication" },
    { name: "Eater.com", type: "Internet" },
    { name: "Food52", type: "Internet" },
    { name: "Tasty.co", type: "Internet" },
    { name: "Cooks Illustrated", type: "Publication" },
    { name: "Minimalist Baker", type: "Internet" },
    { name: "Yummly", type: "Internet" },
    { name: "Healthy Bites", type: "Internet" },
    { name: "Spoon University", type: "Internet" },
    { name: "Chowhound", type: "Internet" },
    { name: "Flavor Journal", type: "Publication" },
    { name: "PlantBased Blog", type: "Internet" }
  ],
  technology: [
    { name: "TechCrunch", type: "Internet" },
    { name: "Wired", type: "Publication" },
    { name: "The Verge", type: "Internet" },
    { name: "Ars Technica", type: "Internet" },
    { name: "CNET", type: "Internet" },
    { name: "ZDNet", type: "Internet" },
    { name: "Tom's Hardware", type: "Internet" },
    { name: "Engadget", type: "Internet" },
    { name: "Android Authority", type: "Internet" },
    { name: "iMore", type: "Internet" },
    { name: "Stack Overflow", type: "Internet" },
    { name: "GitHub Blog", type: "Internet" },
    { name: "Medium – Tech", type: "Internet" },
    { name: "The Information", type: "Publication" },
    { name: "IEEE Spectrum", type: "Publication" },
    { name: "Hacker News", type: "Internet" },
    { name: "Product Hunt", type: "Internet" },
    { name: "TechRepublic", type: "Internet" },
    { name: "Digital Trends", type: "Internet" },
    { name: "CodeNewbie.io", type: "Internet" }
  ]
};

/**
 * MockDataBuilder
 * Main React component that renders the UI and handles all logic for generating and exporting mock documents.
 */
export default function MockDataBuilder() {
  const [output, setOutput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  /**
   * handleSubmit
   * Handles form submission: reads form values, processes input text or file, generates mock data, and triggers download.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    const form = e.currentTarget;
    // Document ID field (not currently used in output)
    const _docId: string = (form.elements.namedItem("docId") as HTMLInputElement).value;
    void _docId; // Acknowledge unused variable
    // Document title
    const docTitle = (form.elements.namedItem("title") as HTMLInputElement).value;
    // Author name (can be blank for random generation)
    let docAuthor = (form.elements.namedItem("author") as HTMLInputElement).value;
    // Move author check after docAuthor is defined
    if (!docAuthor || docAuthor.trim() === "") {
      const { faker } = await import('@faker-js/faker');
      docAuthor = faker.person.fullName();
    }
    // Number of mock documents to generate
    const numDocs = validateNumericInput((form.elements.namedItem("numDocs") as HTMLInputElement).value, 1, 10, "Number of documents");
    // Number of pages per document
    const pages = validateNumericInput((form.elements.namedItem("pages") as HTMLInputElement).value, 1, 50, "Number of pages");
    // Number of match cards to generate per document
    const matchCards = validateNumericInput((form.elements.namedItem("matchCards") as HTMLInputElement).value, 1, 50, "Number of match cards");
    // Minimum highlights per match card
    const minHighlights = validateNumericInput((form.elements.namedItem("minHighlights") as HTMLInputElement).value, 1, 10, "Minimum highlights");
    // Maximum highlights per match card
    const maxHighlights = validateNumericInput((form.elements.namedItem("maxHighlights") as HTMLInputElement).value, minHighlights, 20, "Maximum highlights");

    // File input for text or PDF
    const fileInput = form.elements.namedItem("textFile") as HTMLInputElement;
    // Textarea for pasted document content
    const pastedText = (form.elements.namedItem("pastedText") as HTMLTextAreaElement).value;

    let textContent = pastedText.trim();

    // If no pasted text, try to read from file input (supports PDF or text)
    if (!textContent && fileInput.files?.[0]) {
      const file = fileInput.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setIsLoading(true);
        // PDF parsing using pdfjs
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const maxPages = pdf.numPages;
        const texts: string[] = [];

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: unknown) => (item as { str?: string }).str || '').join(" ");
          texts.push(pageText);
        }

        textContent = texts.join("\n\n").trim();
        setIsLoading(false);
      } else {
        // Plain text file
        textContent = (await file.text()).trim();
      }
    }

    // If still no content, generate random lorem text
    if (!textContent) {
      const { faker } = await import('@faker-js/faker');
      textContent = faker.lorem.paragraphs(15);
    }

    // Main generation loop: creates an array of mock document objects
    const documents = [];

    for (let docIndex = 0; docIndex < numDocs; docIndex++) {
      // Split the text into roughly equal page chunks
      const words = textContent.split(/\s+/);
      const wordsPerPage = Math.ceil(words.length / pages);
      const pageTexts = Array.from({ length: pages }, (_, i) =>
        words.slice(i * wordsPerPage, (i + 1) * wordsPerPage).join(" ")
      );

      // Select topic pool
      const topic = selectedTopic || getTopicFromTitle(docTitle);
      const sourcePool = sourcePools[topic] || sourcePools.general;

      const matchCardsData = [];
      const highlightsData = [];
      let highlightId = 1;

      // --- Match Card Generation ---
      // Ensure at least one of each sourceType: "Internet", "Publication", "Submitted Works"
      const requiredSourceTypes = ["Internet", "Publication", "Submitted Works"];
      // Note: getSourceType function was removed as it was unused
      const addedSourceTypes: Record<string, boolean> = {};
      for (let i = 0; i < matchCards; i++) {
         
        console.debug(`[MockDataBuilder] Generating matchCard #${i + 1} (rule-based)...`);
        const matchCardId = `mc${i + 1}`;
        // Random number of highlights for this match card
        const numSpans = Math.floor(Math.random() * (maxHighlights - minHighlights + 1)) + minHighlights;
        const matches: Array<Record<string, unknown>> = [];
        // For tracking highlights for this matchCard
        const highlightsForCard: Array<Record<string, unknown>> = [];

        // Gather all sentences from all pages for span selection
        const allSentencesByPage: { pageIdx: number; sentences: string[]; pageText: string }[] = pageTexts.map((pageText, idx) => ({
          pageIdx: idx,
          sentences: pageText.match(/[^.?!]+[.?!]/g) || [pageText],
          pageText
        }));

        /**
         * getSpanBySentence
         * Helper function to extract a span of sentences from a page, ensuring minimum word count and valid offsets.
         */
        function getSpanBySentence(pageObj: { pageIdx: number; sentences: string[]; pageText: string }, start: number, len: number) {
          const spanSentences = pageObj.sentences.slice(start, start + len);
          const spanText = spanSentences.join(" ").trim();
          if (spanText.split(/\s+/).length < 7) return null;
          const startOffset = pageObj.pageText.indexOf(spanText);
          if (startOffset === -1 || spanText.length === 0) return null;
          const endOffset = startOffset + spanText.length;
          return {
            pageIdx: pageObj.pageIdx,
            spanText,
            spanSentences,
            startOffset,
            endOffset,
            pageObj
          };
        }

        // 1. First, create 2 multi-sentence matches (3–6 sentences, 7+ words)
        let multiDone = 0;
        let tryCount = 0;
        while (multiDone < 2 && tryCount < 20) {
          tryCount++;
          // Pick a random page
          const pageObj = allSentencesByPage[Math.floor(Math.random() * allSentencesByPage.length)];
          if (pageObj.sentences.length < 3) continue;
          // Pick a random start index so that at least 3 sentences remain
          const maxStart = Math.max(0, pageObj.sentences.length - 3);
          const spanStart = Math.floor(Math.random() * (maxStart + 1));
          // 3–6 sentences
          const spanLen = Math.floor(Math.random() * 4) + 3;
          const span = getSpanBySentence(pageObj, spanStart, spanLen);
          if (!span) continue;
          // Add highlight/match
          const highlight = {
            id: `h${highlightId++}`,
            page: span.pageIdx + 1,
            startOffset: span.startOffset,
            endOffset: span.endOffset,
            text: span.spanText,
            isExcluded: false,
            matchCardId
          };
          highlightsData.push(highlight);
          highlightsForCard.push({
            page: span.pageIdx + 1,
            start: span.startOffset,
            end: span.endOffset
          });
          const before = span.pageObj.pageText.slice(Math.max(0, span.startOffset - 100), span.startOffset).trimStart();
          const after = span.pageObj.pageText.slice(span.endOffset, span.endOffset + 100).trimEnd();
          matches.push({
            highlightId: highlight.id,
            contextBefore: before,
            matchedText: span.spanText,
            contextAfter: after,
            page: span.pageIdx + 1,
            startOffset: span.startOffset,
            endOffset: span.endOffset
          });
          multiDone++;
        }

        // 2. Then create the remaining matches (to meet numSpans) as 1–3 sentence spans (7+ words)
        let singlesNeeded = Math.max(0, numSpans - matches.length);
        let tries = 0;
        while (singlesNeeded > 0 && tries < 30) {
          tries++;
          const pageObj = allSentencesByPage[Math.floor(Math.random() * allSentencesByPage.length)];
          if (pageObj.sentences.length < 1) continue;
          const maxStart = Math.max(0, pageObj.sentences.length - 1);
          const spanStart = Math.floor(Math.random() * (maxStart + 1));
          const spanLen = Math.floor(Math.random() * 3) + 1; // 1–3 sentences
          const span = getSpanBySentence(pageObj, spanStart, spanLen);
          if (!span) continue;
          // Add highlight/match
          const highlight = {
            id: `h${highlightId++}`,
            page: span.pageIdx + 1,
            startOffset: span.startOffset,
            endOffset: span.endOffset,
            text: span.spanText,
            isExcluded: false,
            matchCardId
          };
          highlightsData.push(highlight);
          highlightsForCard.push({
            page: span.pageIdx + 1,
            start: span.startOffset,
            end: span.endOffset
          });
          const before = span.pageObj.pageText.slice(Math.max(0, span.startOffset - 100), span.startOffset).trimStart();
          const after = span.pageObj.pageText.slice(span.endOffset, span.endOffset + 100).trimEnd();
          matches.push({
            highlightId: highlight.id,
            contextBefore: before,
            matchedText: span.spanText,
            contextAfter: after,
            page: span.pageIdx + 1,
            startOffset: span.startOffset,
            endOffset: span.endOffset
          });
          singlesNeeded--;
        }

        // Remove extra fields from matches before saving to matchCardsData
        const cleanedMatches = matches.map(({highlightId, contextBefore, matchedText, contextAfter}) => ({
          highlightId, contextBefore, matchedText, contextAfter
        }));

         
        console.debug(
          `[MockDataBuilder] Finished matchCard #${i + 1}: added ${cleanedMatches.length} matches.`
        );

        if (cleanedMatches.length === 0) {
           
          console.warn(`[MockDataBuilder] Skipped matchCard #${i + 1} due to no matches.`);
          continue;
        }

        // Pick a plausible source object and URL for this match card
        const source = sourcePool[i % sourcePool.length];
        const urlOptions = sourceUrlOptions[topic] || [];
        const sourceUrl =
          urlOptions[i % urlOptions.length]?.[Math.floor(Math.random() * 3)] ||
          `https://example.com/source${i + 1}`;

        // Use type from source object, but allow override logic to ensure all types are present
        const inferredSourceType = source.type;
        let overrideSourceType: string | null = null;
        // For the first three matchcards, force the missing types
        if (i < requiredSourceTypes.length) {
          for (const type of requiredSourceTypes) {
            if (!addedSourceTypes[type]) {
              overrideSourceType = type;
              break;
            }
          }
        }
        // If still not all required types have been added, and this is the last matchCard, force any missing one
        if (i === matchCards - 1) {
          for (const type of requiredSourceTypes) {
            if (!addedSourceTypes[type]) {
              overrideSourceType = type;
              break;
            }
          }
        }
        const sourceType = overrideSourceType || inferredSourceType;
        addedSourceTypes[sourceType] = true;

        matchCardsData.push({
          id: matchCardId,
          sourceType,
          sourceName:
            sourceType === "Submitted Works"
              ? `Submitted to Another Institution - ${getRandomPastDate()}`
              : source.name,
          sourceUrl,
          matchCount: cleanedMatches.length,
          similarityPercent: 0, // placeholder, will update after all highlights are collected
          matchedWordCount: cleanedMatches.reduce((sum, m) => sum + (m.matchedText as string).split(/\s+/).length, 0),
          matches: cleanedMatches
        });
      }

      // Info log: summary after building highlights and matchCards
       
      console.info(
        `[MockDataBuilder] Built highlights: ${highlightsData.length}, matchCards: ${matchCardsData.length}`
      );

      // Calculate total word count for similarity percent
      const totalWords = pageTexts.reduce((sum, page) => sum + page.split(/\s+/).length, 0);
      matchCardsData.forEach(card => {
        card.similarityPercent = Math.round((card.matchedWordCount / totalWords) * 100);
      });

      // Construct the document object
      const doc = {
        id: `doc-${slugify(docTitle)}-${Date.now()}-${docIndex + 1}`,
        title: `${docTitle} ${docIndex + 1}`,
        author: docAuthor,
        pages: pageTexts.map((content, i) => ({ number: i + 1, content })),
        matchCards: matchCardsData,
        highlights: highlightsData
      };

      documents.push(doc);
    }

    setOutput(JSON.stringify(documents, null, 2));
    setIsLoading(false);

    // Export all documents as a ZIP file
    const zip = new JSZip();
    documents.forEach((doc, i) => {
      zip.file(`mock-document-${i + 1}.json`, JSON.stringify(doc, null, 2));
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mock-documents.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <Helmet>
        <title>Mock Data Builder</title>
      </Helmet>
      {isLoading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-700 mt-1">Processing PDF...</p>
        </div>
      )}
      <h1 className="text-xl font-bold mb-4">Mock Data Builder</h1>
      <p>This tool lets you generate test documents with pages, highlights, and match cards.</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">Document Details</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-screen-md" onSubmit={handleSubmit}>
        {/* Document ID input (not used in output, for user reference) */}
        <div>
          <label className="block font-medium">Document ID</label>
          <input
            type="text"
            name="docId"
            defaultValue="mock-doc"
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls the document identifier (not shown in output)
          />
        </div>
        {/* Document Title input */}
        <div>
          <label className="block font-medium">Title</label>
          <input
            type="text"
            name="title"
            defaultValue="Mock Document"
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls the document title
          />
        </div>
        {/* Topic selection dropdown */}
        <div>
          <label className="block font-medium">Topic Area</label>
          <select
            name="topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls which topic area to use for sources, or auto-detect from title
          >
            <option value="">Auto-detect</option>
            <option value="business">Business</option>
            <option value="nature">Nature</option>
            <option value="academic">Academic</option>
            <option value="entertainment">Entertainment</option>
            <option value="sports">Sports</option>
            <option value="food">Food</option>
            <option value="technology">Technology</option>
          </select>
        </div>
        {/* Author input (can be blank for random generation) */}
        <div>
          <label className="block font-medium">Author</label>
          <input
            type="text"
            name="author"
            className="mt-0.5 w-full border px-3 py-1 rounded"
            readOnly
            placeholder="Enter a fake name"
            onFocus={e => { e.currentTarget.readOnly = false; }}
            // Controls the author name. If left blank, a random name is generated.
          />
          <div className="text-xs text-gray-500 mt-1">
            If you don’t enter a name, one will be generated automatically.
          </div>
        </div>
        {/* Number of documents to generate */}
        <div>
          <label className="block font-medium">Number of Documents</label>
          <input
            type="number"
            name="numDocs"
            defaultValue={1}
            min={1}
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls how many documents to generate in the ZIP
          />
        </div>
        {/* Number of pages per document */}
        <div>
          <label className="block font-medium">Number of Pages</label>
          <input
            type="number"
            name="pages"
            defaultValue={5}
            min={1}
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls number of pages per document
          />
        </div>
        {/* Number of match cards per document */}
        <div>
          <label className="block font-medium">Number of Match Cards</label>
          <input
            type="number"
            name="matchCards"
            defaultValue={12}
            min={1}
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls number of match cards (sources) per document
          />
        </div>
        {/* Minimum highlights per match card */}
        <div>
          <label className="block font-medium">Min Highlights per Match</label>
          <input
            type="number"
            name="minHighlights"
            defaultValue={1}
            min={1}
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls minimum number of highlights per match card
          />
        </div>
        {/* Maximum highlights per match card */}
        <div>
          <label className="block font-medium">Max Highlights per Match</label>
          <input
            type="number"
            name="maxHighlights"
            defaultValue={5}
            min={1}
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Controls maximum number of highlights per match card
          />
        </div>
        {/* File upload for text or PDF */}
        <div>
          <label className="block font-medium">
            Upload Text File <span className="text-sm text-gray-500">(Supported: .txt, .pdf)</span>
          </label>
          <input
            type="file"
            name="textFile"
            accept=".txt,.pdf"
            className="mt-0.5 w-full py-0.5"
            // Allows uploading a .txt or .pdf file for document content
          />
        </div>
        {/* Textarea for pasted document content */}
        <div>
          <label className="block font-medium">Or Paste Text</label>
          <textarea
            name="pastedText"
            rows={10}
            placeholder="Paste document content here..."
            className="mt-0.5 w-full border px-3 py-1 rounded"
            // Allows pasting document content directly
          />
        </div>
        {/* Submit button */}
        <div className="col-span-1 md:col-span-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Generate Document
          </button>
        </div>
      </form>
      {output && (
        <div className="mt-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            type="button"
            className="mb-2 text-blue-600 underline"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          {showPreview && (
            <div className="space-y-4">
              {JSON.parse(output).map((doc: Record<string, unknown>, index: number) => (
                <div key={index} className="bg-gray-100 p-4 rounded max-w-3xl">
                  <h2 className="text-lg font-semibold mb-1">{doc.title as string}</h2>
                  <p className="text-sm text-gray-700 mb-2">Author: {doc.author as string}</p>
                  <p className="text-sm text-gray-700 mb-1">Pages: {(doc.pages as unknown[]).length}</p>
                  <p className="text-sm text-gray-700 mb-1">Match Cards: {(doc.matchCards as unknown[]).length}</p>
                  <p className="text-sm text-gray-700 mb-1">Highlights: {(doc.highlights as unknown[]).length}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">Show raw JSON</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(doc, null, 2)}</pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
/**
 * sourceUrlOptions
 * Generates a list of plausible source URLs for each source in every topic category.
 */
const sourceUrlOptions: Record<string, string[][]> = {};
Object.entries(sourcePools).forEach(([category, sources]) => {
  sourceUrlOptions[category] = sources.map(sourceObj => {
    const name = sourceObj.name;
    const base = slugify(name.split("–")[0].split(".")[0].split(" ")[0]);
    return [
      `https://${base}.com/article/${Math.floor(Math.random() * 10000)}`,
      `https://${base}.org/${base}/insight/${Math.floor(Math.random() * 1000)}`,
      `https://www.${base}.net/posts/${Date.now()}`
    ];
  });
});
// If author is empty, generate a realistic name using faker (see handleSubmit)