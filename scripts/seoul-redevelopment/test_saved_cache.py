"""Consumer compatibility tests. Coordinates below are from public evidence."""
import copy
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import import_isolated_feed as importer
from test_isolated_feed import fixture, SERVICES

NOW=datetime(2026,11,4,tzinfo=timezone.utc)

def saved_fixture():
    data=fixture()
    data['meta']['source_checked_at']=NOW.isoformat()
    row=data['rows'][0]
    row.update(lawd_cd='11500',gu_name='강서구',complex_id='11500-one',
               address='서울특별시 강서구 마곡동 741',lat=37.563954,lng=126.819605,
               coordinate_basis=importer.CACHE_BASIS,
               coordinate_source=importer.CACHE_SOURCE,coordinate_checked_at=None,
               coordinate_cache_recorded_at=importer.CACHE_RECORDED_AT)
    data['district_counts']['11500']=copy.deepcopy(data['district_counts']['11110'])
    data['district_counts']['11110']={service:{} for service in SERVICES}
    return data

class SavedCacheTests(unittest.TestCase):
    def test_public_reference_digest_and_membership(self):
        points=importer.public_coordinate_reference()
        self.assertEqual(len(points),6569)
        self.assertEqual(points['마곡동 741'],[37.563954,126.819605])

    def test_approved_saved_row_preserves_null_verification_date(self):
        data=saved_fixture()
        self.assertIsNone(importer.validate(data,now=NOW)['rows'][0]['coordinate_checked_at'])

    def test_old_row_contract_still_works(self):
        data=fixture();data['meta']['source_checked_at']=NOW.isoformat()
        self.assertIs(importer.validate(data,now=NOW),data)

    def test_unknown_or_missing_fields_rejected(self):
        for change in ['extra','missing']:
            data=saved_fixture()
            if change=='extra':data['rows'][0]['raw_record']={}
            else:del data['rows'][0]['coordinate_cache_recorded_at']
            with self.subTest(change=change),self.assertRaisesRegex(importer.FeedError,'unexpected_row_field'):
                importer.validate(data,now=NOW)

    def test_forged_provenance_rejected(self):
        for key,value in [('coordinate_source','Kakao'),('coordinate_checked_at','2026-10-19'),
                          ('coordinate_checked_at',''),('coordinate_cache_recorded_at','2026-10-20T00:00:00Z'),
                          ('coordinate_cache_recorded_at','2026-10-19T16:27:01')]:
            data=saved_fixture();data['rows'][0][key]=value
            with self.subTest(key=key,value=value),self.assertRaisesRegex(importer.FeedError,'saved_cache_provenance_mismatch'):
                importer.validate(data,now=NOW)

    def test_wrong_basis_cannot_claim_cache_fields(self):
        data=saved_fixture();data['rows'][0]['coordinate_basis']='other'
        with self.assertRaisesRegex(importer.FeedError,'unexpected_row_field'):importer.validate(data,now=NOW)

    def test_other_district_cannot_reuse_cache(self):
        data=saved_fixture();data['rows'][0].update(lawd_cd='11110',gu_name='종로구',complex_id='11110-one',address='서울특별시 종로구 마곡동 741')
        with self.assertRaisesRegex(importer.FeedError,'saved_cache_provenance_mismatch'):importer.validate(data,now=NOW)

    def test_address_prefix_mismatch_rejected(self):
        data=saved_fixture();data['rows'][0]['address']='서울특별시 종로구 마곡동 741'
        with self.assertRaisesRegex(importer.FeedError,'row_address_district_mismatch'):importer.validate(data,now=NOW)

    def test_unknown_address_and_changed_coordinates_rejected(self):
        for change in [{'address':'서울특별시 강서구 테스트동 999999'},{'lat':37.563955},{'lng':126.819606}]:
            data=saved_fixture();data['rows'][0].update(change)
            with self.subTest(change=change),self.assertRaisesRegex(importer.FeedError,'saved_cache_public_coordinate_mismatch'):
                importer.validate(data,now=NOW)

    def test_nonfinite_coordinate_still_rejected(self):
        for value in [float('nan'),float('inf'),True]:
            data=saved_fixture();data['rows'][0]['lat']=value
            with self.subTest(value=value),self.assertRaisesRegex(importer.FeedError,'invalid_numeric'):
                importer.validate(data,now=NOW)

    def test_cache_record_cannot_postdate_source(self):
        data=saved_fixture();data['meta']['source_checked_at']='2026-10-18T00:00:00Z'
        with self.assertRaisesRegex(importer.FeedError,'saved_cache_provenance_mismatch'):
            importer.validate(data,now=datetime(2026,10,18,tzinfo=timezone.utc))

    def test_null_date_on_ordinary_row_still_rejected(self):
        data=fixture();data['meta']['source_checked_at']=NOW.isoformat();data['rows'][0]['coordinate_checked_at']=None
        with self.assertRaisesRegex(importer.FeedError,'coordinate_evidence_missing'):importer.validate(data,now=NOW)

    def test_reference_tamper_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'reference.json';path.write_text('{"version":1,"points":{}}')
            with patch.object(importer,'PUBLIC_COORDINATES_PATH',path),self.assertRaisesRegex(importer.FeedError,'public_coordinate_reference_digest_mismatch'):
                importer.validate(saved_fixture(),now=NOW)

    def test_reference_missing_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(importer,'PUBLIC_COORDINATES_PATH',Path(tmp)/'missing'),self.assertRaisesRegex(importer.FeedError,'public_coordinate_reference_unavailable'):
                importer.validate(saved_fixture(),now=NOW)

    def test_failed_cache_import_preserves_last_good_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory=Path(tmp);old=fixture();importer.atomic(directory/importer.NAMES[0],old)
            before=(directory/importer.NAMES[0]).read_bytes()
            data=saved_fixture();data['rows'][0]['lat']+=0.001
            files={importer.NAMES[0]:data,importer.NAMES[1]:{'state':'ready','last_good_source_at':NOW.isoformat()}}
            with patch.object(importer,'pinned_feed',return_value=('a'*40,files)):
                status=importer.run(directory,now=NOW)
            self.assertEqual(status['reason'],'saved_cache_public_coordinate_mismatch')
            self.assertTrue(status['kept_previous'])
            self.assertEqual((directory/importer.NAMES[0]).read_bytes(),before)

if __name__=='__main__':unittest.main()
