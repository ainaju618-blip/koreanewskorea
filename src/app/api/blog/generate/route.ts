import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface GenerateRequest {
    topic: string;
    category?: string;
    style?: 'informative' | 'entertaining' | 'analytical';
    length?: 'short' | 'medium' | 'long';
    source_url?: string;
}

const WORD_COUNTS = {
    short: 800,
    medium: 1500,
    long: 2500
};

const STYLE_PROMPTS = {
    informative: 'Write in an informative, educational tone. Focus on facts and clear explanations.',
    entertaining: 'Write in an engaging, fun tone. Use storytelling and relatable analogies.',
    analytical: 'Write in an analytical, deep-dive tone. Provide thorough analysis and insights.'
};

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: GenerateRequest = await request.json();

        if (!body.topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            );
        }

        const wordCount = WORD_COUNTS[body.length || 'medium'];
        const stylePrompt = STYLE_PROMPTS[body.style || 'entertaining'];
        const category = body.category || 'sf-entertainment';

        // Build the prompt
        const systemPrompt = `You are CosmicPulse, an expert science and SF writer for Korean audiences.
You write engaging, accurate content about space, science fiction, and astronomy.
Your writing is accessible to general audiences while maintaining scientific accuracy.
You write in Korean (Hangul) with occasional English terms for technical vocabulary.
Always cite sources when making scientific claims.`;

        const userPrompt = `Write a blog post about: "${body.topic}"

Category: ${category}
Target word count: approximately ${wordCount} words
${body.source_url ? `Reference source: ${body.source_url}` : ''}

Writing style instructions: ${stylePrompt}

Format your response as JSON with the following structure:
{
    "title": "Engaging Korean title for the blog post",
    "content": "Full blog post content in Korean with proper paragraphs",
    "excerpt": "Short 2-3 sentence summary in Korean",
    "tags": ["tag1", "tag2", "tag3"],
    "seo_title": "SEO optimized title",
    "seo_description": "SEO meta description under 160 characters"
}

Important:
- Write the content in Korean
- Use markdown formatting for headings (##), bold (**), lists
- Include relevant scientific facts and explanations
- Make it engaging for Korean SF/space enthusiasts
- The content should be original and insightful`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 4096,
            temperature: 0.7
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from AI');
        }

        // Parse JSON from response
        let generatedContent;
        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                generatedContent = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback: use the raw text
            generatedContent = {
                title: body.topic,
                content: responseText,
                excerpt: responseText.substring(0, 200),
                tags: [],
                seo_title: body.topic,
                seo_description: body.topic
            };
        }

        // Generate slug
        const { data: slugData } = await supabaseAdmin
            .rpc('generate_blog_slug', { title: generatedContent.title });

        const slug = slugData || generatedContent.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100) + '-' + Date.now();

        // Create the post
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                title: generatedContent.title,
                slug: slug,
                content: generatedContent.content,
                excerpt: generatedContent.excerpt,
                category: category,
                tags: generatedContent.tags || [],
                seo_title: generatedContent.seo_title,
                seo_description: generatedContent.seo_description,
                source_url: body.source_url,
                ai_generated: true,
                ai_model: 'gpt-4o-mini',
                ai_prompt: body.topic,
                status: 'draft',
                author_name: 'CosmicPulse AI'
            })
            .select()
            .single();

        if (postError) {
            console.error('Failed to create post:', postError);
            throw new Error('Failed to save post');
        }

        // Log the AI generation
        const duration = Date.now() - startTime;
        const tokensTotal = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);

        await supabaseAdmin
            .from('blog_ai_logs')
            .insert({
                post_id: post.id,
                model: 'gpt-4o-mini',
                prompt: body.topic,
                response_preview: generatedContent.content?.substring(0, 500),
                tokens_input: completion.usage?.prompt_tokens,
                tokens_output: completion.usage?.completion_tokens,
                tokens_total: tokensTotal,
                duration_ms: duration,
                status: 'success'
            });

        return NextResponse.json({
            success: true,
            post: post
        });

    } catch (error) {
        console.error('AI generation error:', error);

        // Log the error
        await supabaseAdmin
            .from('blog_ai_logs')
            .insert({
                model: 'gpt-4o-mini',
                prompt: 'Unknown',
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error'
            });

        return NextResponse.json(
            { error: 'Failed to generate content' },
            { status: 500 }
        );
    }
}
