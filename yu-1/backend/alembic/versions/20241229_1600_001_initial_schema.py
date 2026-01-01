"""Initial schema - 384효 + 카테고리 + 해석 테이블

Revision ID: 001
Revises:
Create Date: 2024-12-29 16:00:00

컨설팅 확정 스키마:
- hexagrams: 17개 필드
- categories: 8개 필드
- interpretations: FK + period + base_text
- user_history: 로그 테이블
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. hexagrams 테이블 (384효)
    op.create_table(
        'hexagrams',
        sa.Column('id', sa.String(10), primary_key=True, index=True),  # "14-6"
        sa.Column('gua_number', sa.Integer(), nullable=False, index=True),
        sa.Column('gua_name_ko', sa.String(20), nullable=False),
        sa.Column('gua_name_hanja', sa.String(20), nullable=False),
        sa.Column('yao_number', sa.Integer(), nullable=False),
        sa.Column('yao_position', sa.String(20), nullable=False),
        sa.Column('original_text', sa.Text(), nullable=False),
        sa.Column('original_meaning', sa.Text(), nullable=False),
        sa.Column('direction', sa.String(10), nullable=False, server_default='정체'),
        sa.Column('score', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('core_message', sa.String(200), nullable=False),
        sa.Column('caution', sa.String(200), nullable=False),
        sa.Column('timing', sa.String(20), nullable=False),
        sa.Column('keywords', postgresql.JSON(astext_type=sa.Text()), server_default='[]'),
        sa.Column('image_symbol', sa.String(200), nullable=True),
        sa.Column('age_target', sa.String(20), server_default='전연령'),
        sa.Column('priority', sa.String(10), server_default='중'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # 2. categories 테이블 (250개)
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('major_id', sa.Integer(), nullable=False, index=True),
        sa.Column('major_name', sa.String(20), nullable=False),
        sa.Column('major_icon', sa.String(10), nullable=False),
        sa.Column('sub_name', sa.String(50), nullable=False),
        sa.Column('description', sa.String(200), nullable=True),
        sa.Column('keywords', postgresql.JSON(astext_type=sa.Text()), server_default='[]'),
        sa.Column('age_target', sa.String(20), server_default='전연령'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 3. interpretations 테이블 (카테고리별 해석)
    op.create_table(
        'interpretations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('hexagram_id', sa.String(10), sa.ForeignKey('hexagrams.id'), nullable=False, index=True),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), nullable=False, index=True),
        sa.Column('period', sa.String(20), server_default='daily'),
        sa.Column('base_text', sa.Text(), nullable=False),
        sa.Column('tone_hint', sa.String(20), server_default='중립'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.UniqueConstraint('hexagram_id', 'category_id', 'period', name='uq_hex_cat_period'),
    )

    # 4. user_history 테이블 (사용자 로그)
    op.create_table(
        'user_history',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('session_id', sa.String(100), index=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('divination_type', sa.String(20), server_default='iching'),
        sa.Column('period', sa.String(20), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('question', sa.Text(), nullable=True),
        sa.Column('hexagram_id', sa.String(10), nullable=True),
        sa.Column('fortune_score', sa.Integer(), nullable=True),
        sa.Column('interpretation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(200), nullable=True),
    )

    # 인덱스 추가
    op.create_index('ix_hexagrams_gua_yao', 'hexagrams', ['gua_number', 'yao_number'])
    op.create_index('ix_categories_major', 'categories', ['major_id', 'sub_name'])
    op.create_index('ix_interpretations_lookup', 'interpretations', ['hexagram_id', 'category_id', 'period'])


def downgrade() -> None:
    op.drop_index('ix_interpretations_lookup', table_name='interpretations')
    op.drop_index('ix_categories_major', table_name='categories')
    op.drop_index('ix_hexagrams_gua_yao', table_name='hexagrams')

    op.drop_table('user_history')
    op.drop_table('interpretations')
    op.drop_table('categories')
    op.drop_table('hexagrams')
