/**
 * 나주시 데이터 시드 API (한국관광공사 TourAPI 연동)
 * GET /api/seed/naju-tourapi - TourAPI에서 실제 관광지, 맛집, 행사 데이터 가져와서 저장
 *
 * 필수 환경변수: TOUR_API_KEY (공공데이터포털에서 발급)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getTourApiClient,
  CONTENT_TYPE,
  tourSpotToPlace,
  tourEventToEvent,
} from '@/lib/tour-api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  console.log('[Seed] Starting naju-tourapi seed...');
  console.log('[Seed] TOUR_API_KEY exists:', !!process.env.TOUR_API_KEY);
  console.log('[Seed] TOUR_API_KEY length:', process.env.TOUR_API_KEY?.length || 0);

  const tourClient = getTourApiClient();

  if (!tourClient) {
    console.error('[Seed] TourAPI client is null!');
    return NextResponse.json(
      {
        error: 'TOUR_API_KEY가 설정되지 않았습니다.',
        help: '공공데이터포털(data.go.kr)에서 "국문 관광정보 서비스" API 키를 발급받아 .env.local에 TOUR_API_KEY=발급받은키 형태로 추가하세요.',
      },
      { status: 400 }
    );
  }
  console.log('[Seed] TourAPI client created successfully');

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase credentials not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results = {
    attractions: 0,
    restaurants: 0,
    accommodations: 0,
    culture: 0,
    leisure: 0,
    festivals: 0,
    errors: [] as string[],
  };

  const regionCode = 'naju';

  try {
    // 1. 관광지 가져오기
    console.log('[TourAPI] Fetching attractions...');
    const attractions = await tourClient.getAttractions(regionCode, 20);
    console.log(`[TourAPI] Found ${attractions.length} attractions`);

    // 2. 맛집 가져오기
    console.log('[TourAPI] Fetching restaurants...');
    const restaurants = await tourClient.getRestaurants(regionCode, 20);
    console.log(`[TourAPI] Found ${restaurants.length} restaurants`);

    // 3. 숙박 가져오기
    console.log('[TourAPI] Fetching accommodations...');
    const accommodations = await tourClient.getAccommodations(regionCode, 10);
    console.log(`[TourAPI] Found ${accommodations.length} accommodations`);

    // 4. 문화시설 가져오기
    console.log('[TourAPI] Fetching culture facilities...');
    const culture = await tourClient.getCultureFacilities(regionCode, 10);
    console.log(`[TourAPI] Found ${culture.length} culture facilities`);

    // 5. 전국 축제 가져오기 (전국축제 탭용)
    console.log('[TourAPI] Fetching national festivals...');
    const allFestivals = await tourClient.getFestivals(regionCode);
    console.log(`[TourAPI] Found ${allFestivals.length} festivals total`);

    // 주소 기반으로 전국/지역 축제 분류
    // 전남/광주 주소가 포함된 축제 → 지역 축제, 나머지 → 전국 축제
    const regionalKeywords = ['전남', '전라남도', '광주', '나주', '목포', '순천', '여수', '무안', '함평', '담양', '화순', '곡성', '구례', '보성', '고흥', '장흥', '강진', '해남', '영암', '완도', '진도', '신안', '영광', '장성', 'wando', 'jindo'];

    const nationalFestivals = allFestivals.filter(f =>
      !regionalKeywords.some(keyword => f.addr1?.toLowerCase().includes(keyword.toLowerCase()))
    );
    const regionalFestivals = allFestivals.filter(f =>
      regionalKeywords.some(keyword => f.addr1?.toLowerCase().includes(keyword.toLowerCase()))
    );

    console.log(`[TourAPI] Classified: ${nationalFestivals.length} national, ${regionalFestivals.length} regional (전남+광주)`);

    // 7. 레포츠/자연경관 가져오기
    console.log('[TourAPI] Fetching leisure/nature...');
    const leisure = await tourClient.getLeisure(regionCode, 15);
    console.log(`[TourAPI] Found ${leisure.length} leisure/nature spots`);

    // DB에 저장할 데이터 변환
    const placesData = [
      ...attractions.map((s) => ({
        ...tourSpotToPlace(s, regionCode, 'attraction'),
        is_featured: true,
      })),
      ...restaurants.map((s) => ({
        ...tourSpotToPlace(s, regionCode, 'restaurant'),
        is_featured: true,
      })),
      ...accommodations.map((s) => ({
        ...tourSpotToPlace(s, regionCode, 'accommodation'),
        is_featured: false,
      })),
      ...culture.map((s) => ({
        ...tourSpotToPlace(s, regionCode, 'heritage'),
        is_featured: false,
      })),
      ...leisure.map((s) => ({
        ...tourSpotToPlace(s, regionCode, 'nature'),
        is_featured: false,
      })),
    ];

    // 전국 축제 데이터 (sigungu_code = 'national'로 구분)
    const nationalEventsData = nationalFestivals.map((e) => ({
      ...tourEventToEvent(e, regionCode),
      sigungu_code: 'national', // 전국 축제 표시
      sido_code: 'national',
    }));

    // 지역 축제 데이터 - 주소에 따라 sido_code 결정
    const regionalEventsData = regionalFestivals.map((e) => {
      const isGwangju = e.addr1?.includes('광주');
      return {
        ...tourEventToEvent(e, isGwangju ? 'gwangju' : regionCode),
        sigungu_code: isGwangju ? 'gwangju' : 'jeonnam',
        sido_code: isGwangju ? 'gwangju' : 'jeonnam',
      };
    });

    // 전국 축제와 지역 축제를 모두 저장 (sigungu_code로 구분되므로 중복 허용)
    const allEventsData = [...nationalEventsData, ...regionalEventsData];

    // 기존 나주 데이터 삭제
    const { error: deletePlacesError } = await supabase
      .from('places')
      .delete()
      .eq('sigungu_code', regionCode);

    if (deletePlacesError) {
      results.errors.push(`Delete places error: ${deletePlacesError.message}`);
    }

    // 기존 events 전체 삭제 (깨끗하게 시작)
    const { error: deleteEventsError } = await supabase
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 이벤트 삭제

    if (deleteEventsError) {
      results.errors.push(`Delete events error: ${deleteEventsError.message}`);
    }

    // Places 저장
    if (placesData.length > 0) {
      const { data: insertedPlaces, error: placesError } = await supabase
        .from('places')
        .insert(placesData)
        .select();

      if (placesError) {
        results.errors.push(`Insert places error: ${placesError.message}`);
      } else {
        results.attractions = attractions.length;
        results.restaurants = restaurants.length;
        results.accommodations = accommodations.length;
        results.culture = culture.length;
        results.leisure = leisure.length;
        console.log(`[DB] Inserted ${insertedPlaces?.length} places`);
      }
    }

    // Events 저장 (전국 + 지역)
    if (allEventsData.length > 0) {
      const { data: insertedEvents, error: eventsError } = await supabase
        .from('events')
        .insert(allEventsData)
        .select();

      if (eventsError) {
        results.errors.push(`Insert events error: ${eventsError.message}`);
      } else {
        results.festivals = allEventsData.length;
        console.log(`[DB] Inserted ${insertedEvents?.length} events (${nationalEventsData.length} national, ${regionalEventsData.length} regional)`);
      }
    }

    // 이미지가 있는 데이터 수 확인
    const withImage = placesData.filter((p) => (p as { thumbnail_url?: string }).thumbnail_url).length;
    const withoutImage = placesData.filter((p) => !(p as { thumbnail_url?: string }).thumbnail_url).length;

    return NextResponse.json({
      success: results.errors.length === 0,
      message: '나주시 TourAPI 데이터 시드 완료',
      results: {
        attractions: `${results.attractions}개 관광지`,
        restaurants: `${results.restaurants}개 맛집`,
        accommodations: `${results.accommodations}개 숙박`,
        culture: `${results.culture}개 문화시설`,
        leisure: `${results.leisure}개 자연경관`,
        festivals: `${results.festivals}개 축제/행사`,
        images: `이미지 있음: ${withImage}개, 없음: ${withoutImage}개`,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('TourAPI Seed error:', error);
    return NextResponse.json(
      { error: 'TourAPI Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}
