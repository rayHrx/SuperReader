import { RevertPageMapping } from '@/types';

export interface ContentSegment {
  text: string;
  mappingIndex: number | null;
}

export function processContent(content: string, mappings?: RevertPageMapping[]): ContentSegment[] {
  if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
    return [{ text: content, mappingIndex: null }];
  }

  // Create an array of all positions where segments start or end
  const positions: Array<{
    position: number;
    type: 'start' | 'end';
    mappingIndex: number;
  }> = [];

  mappings.forEach((mapping, index) => {
    const startIndex = content.indexOf(mapping.start_phrase);
    const endIndex = content.indexOf(mapping.end_phrase);

    if (startIndex === -1 || endIndex === -1) {
      console.warn(`Mapping ${index} not found in content`);
      return;
    }

    positions.push({
      position: startIndex,
      type: 'start',
      mappingIndex: index
    });

    positions.push({
      position: endIndex + mapping.end_phrase.length,
      type: 'end',
      mappingIndex: index
    });
  });

  // Sort positions by their location in the text
  positions.sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    // If positions are equal, ends come before starts
    return a.type === 'end' ? -1 : 1;
  });

  const segments: ContentSegment[] = [];
  let lastPosition = 0;
  const activeMappings = new Set<number>();

  positions.forEach((pos) => {
    if (pos.position > lastPosition) {
      // Add segment for the text before this position
      segments.push({
        text: content.slice(lastPosition, pos.position),
        mappingIndex: activeMappings.size > 0 ? Array.from(activeMappings)[0] : null
      });
    }

    if (pos.type === 'start') {
      activeMappings.add(pos.mappingIndex);
    } else {
      activeMappings.delete(pos.mappingIndex);
    }

    lastPosition = pos.position;
  });

  // Add remaining text if any
  if (lastPosition < content.length) {
    segments.push({
      text: content.slice(lastPosition),
      mappingIndex: activeMappings.size > 0 ? Array.from(activeMappings)[0] : null
    });
  }

  // Merge adjacent segments with the same mapping index
  const mergedSegments: ContentSegment[] = [];
  let currentSegment: ContentSegment | null = null;

  segments.forEach((segment) => {
    if (!currentSegment) {
      currentSegment = segment;
    } else if (currentSegment.mappingIndex === segment.mappingIndex) {
      currentSegment.text += segment.text;
    } else {
      mergedSegments.push(currentSegment);
      currentSegment = segment;
    }
  });

  if (currentSegment) {
    mergedSegments.push(currentSegment);
  }

  return mergedSegments;
}