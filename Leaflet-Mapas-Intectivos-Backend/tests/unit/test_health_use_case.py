import unittest

from src.application.use_cases.get_health_status import GetHealthStatusUseCase


class TestGetHealthStatusUseCase(unittest.TestCase):
    def test_execute_returns_ok_payload(self) -> None:
        payload = GetHealthStatusUseCase().execute()

        self.assertEqual(payload["status"], "ok")
        self.assertIn("service", payload)


if __name__ == "__main__":
    unittest.main()

