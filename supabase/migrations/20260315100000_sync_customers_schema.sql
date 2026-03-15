-- customers 테이블 스키마를 애플리케이션 코드와 동기화

-- 1. memo 컬럼을 notes로 변경 (애플리케이션에서 notes로 사용 중)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'memo') THEN
        ALTER TABLE customers RENAME COLUMN memo TO notes;
    END IF;
END $$;

-- 2. status 컬럼 추가 (active/inactive 등 상태 관리 목적)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;
